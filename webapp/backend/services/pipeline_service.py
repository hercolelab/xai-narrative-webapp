"""Service for integrating with the LLM pipeline."""
import os
import sys
import json
import ast
import random
import re
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path

# Add paths to import from llm_kd
# Try multiple possible locations
project_root = Path(__file__).parent.parent.parent  # webapp/
repo_root = project_root.parent  # xai-narrative-webapp/

possible_paths = [
    repo_root / "llm_kd",  # xai-narrative-webapp/llm_kd (submodule location)
    project_root.parent.parent / "llm_kd",  # ../../llm_kd (sibling of xai-narrative-webapp)
    project_root.parent / "llm_kd",  # ../llm_kd (if in webapp directory)
    project_root / "llm_kd",  # ./llm_kd (if in same directory)
    Path("/home/hl-fury/VScode/silver/llm_kd"),  # absolute fallback
]

llm_kd_path = None
for path in possible_paths:
    if path.exists():
        sys.path.insert(0, str(path))
        llm_kd_path = path
        print(f"✓ Found llm_kd at: {path}")
        break
else:
    print("⚠️ Warning: llm_kd repository not found in any expected location")
    print(f"   Searched in: {possible_paths}")
    print("   If using git submodule, run: git submodule update --init --recursive")

# Try to import vLLM (optional, only needed for vLLM models)
try:
    from vllm import LLM, SamplingParams
    from vllm.lora.request import LoRARequest
    VLLM_AVAILABLE = True
except ImportError:
    print("Info: vLLM not available. Only Gemini models will work.")
    VLLM_AVAILABLE = False
    LLM = None
    SamplingParams = None
    LoRARequest = None

# Try to import transformers for tokenizer
try:
    from transformers import AutoTokenizer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    print("Warning: transformers not available.")
    TRANSFORMERS_AVAILABLE = False
    AutoTokenizer = None

# Try to import from llm_kd
try:
    from src.utils import MODEL_MAPPING, prompt as prompt_template, get_checkpoint_step, CHECKPOINT_MAPPING
    from data.dataset_kb import dataset_kb
    # Optional import
    try:
        from src.explainer.test_counterfactuals import test_counterfactuals
    except ImportError:
        test_counterfactuals = {}
    print("✓ Successfully imported from llm_kd")
except ImportError as e:
    print(f"Warning: Could not import from llm_kd: {e}")
    print("Make sure the llm_kd repository is available and dependencies are installed")
    MODEL_MAPPING = {}
    prompt_template = None
    dataset_kb = {}
    test_counterfactuals = {}
    get_checkpoint_step = None
    CHECKPOINT_MAPPING = {}

# Try to import Google Generative AI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    print("Warning: google-generativeai not available. Gemini models will not work.")
    GEMINI_AVAILABLE = False
    genai = None


class PipelineService:
    """Service for managing LLM pipeline operations."""
    
    def __init__(self):
        """Initialize the pipeline service."""
        # Note: Models are loaded fresh for each request and unloaded after
        # to avoid GPU memory issues. No model caching is used.
        self.default_params = {
            "temperature": 0.6,
            "top_p": 0.8,
            "max_tokens": 4096,
            "repetition_penalty": 1.05,
            "max_model_len": 8192
        }
        
        # Get the outputs_unsloth directory path
        backend_dir = Path(__file__).parent.parent
        self.outputs_unsloth_dir = backend_dir / "outputs_unsloth"
        
        # Load test_counterfactuals.json from backend directory
        json_path = backend_dir / "test_counterfactuals.json"
        
        self.counterfactuals_data = {}
        if json_path.exists():
            try:
                with open(json_path, 'r') as f:
                    self.counterfactuals_data = json.load(f)
                print(f"Loaded test_counterfactuals.json with {len(self.counterfactuals_data)} datasets")
            except Exception as e:
                print(f"Warning: Could not load test_counterfactuals.json: {e}")
                self.counterfactuals_data = {}
        else:
            print(f"Warning: test_counterfactuals.json not found at {json_path}")
            # Fallback to imported test_counterfactuals if available
            if 'test_counterfactuals' in globals() and test_counterfactuals:
                self.counterfactuals_data = test_counterfactuals
                print("Using test_counterfactuals from llm_kd import")
        
        # Dataset name mapping (JSON keys to API-friendly names)
        # JSON has: "Titanic", "Adult Income", "California Housing", "Diabetes"
        self.dataset_mapping = {
            'adult': 'Adult Income',
            'adult income': 'Adult Income',
            'titanic': 'Titanic',
            'california': 'California Housing',
            'california housing': 'California Housing',
            'diabetes': 'Diabetes'
        }
        
        # Reverse mapping for display names
        self.dataset_display_names = {
            'adult': 'Adult Income',
            'titanic': 'Titanic',
            'california': 'California Housing',
            'diabetes': 'Diabetes'
        }
        
        # Initialize Google Generative AI if available
        if GEMINI_AVAILABLE:
            api_key = os.getenv("GOOGLE_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                print("Google Generative AI configured successfully")
            else:
                print("Warning: GOOGLE_API_KEY not set. Gemini models will not work.")
        
        # Gemini model name (configurable via environment variable)
        self.GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash-exp")
    
    def get_available_datasets(self) -> list:
        """Get list of available datasets from the loaded JSON file."""
        # Always return all four datasets in a consistent order
        default_datasets = ['adult', 'titanic', 'california', 'diabetes']
        
        if self.counterfactuals_data:
            # Get datasets from JSON
            available_json_keys = set(self.counterfactuals_data.keys())
            # Map JSON keys to API-friendly lowercase names
            available_datasets = []
            for api_name in default_datasets:
                json_key = self.dataset_mapping.get(api_name)
                if json_key and json_key in available_json_keys:
                    available_datasets.append(api_name)
            
            # Return available datasets in consistent order, or fallback to default
            return available_datasets if available_datasets else default_datasets
        
        return default_datasets
    
    def get_available_models_for_dataset(self, dataset: str) -> List[str]:
        """
        Get list of available fine-tuned models for a specific dataset.
        Scans the outputs_unsloth/outputs_unsloth_{dataset}_worker folder
        and returns all non-empty directory names without the 'unsloth_' prefix.
        """
        models = []
        
        # Build the path to the dataset's worker folder
        dataset_folder = self.outputs_unsloth_dir / f"outputs_unsloth_{dataset}_worker"
        
        if not dataset_folder.exists():
            print(f"Warning: Dataset folder not found: {dataset_folder}")
            return models
        
        # Scan for model directories
        try:
            for model_dir in dataset_folder.iterdir():
                if model_dir.is_dir():
                    # Check if directory is non-empty (has checkpoint subdirectory)
                    has_checkpoint = any(
                        child.is_dir() and child.name.startswith("checkpoint-")
                        for child in model_dir.iterdir()
                    )
                    
                    if has_checkpoint:
                        model_name = model_dir.name
                        # Remove 'unsloth_' prefix if present
                        if model_name.startswith("unsloth_"):
                            display_name = model_name[8:]  # Remove 'unsloth_' prefix
                        else:
                            display_name = model_name
                        models.append(display_name)
        except Exception as e:
            print(f"Error scanning model directories: {e}")
        
        return sorted(models)
    
    def _get_lora_checkpoint_path(self, dataset: str, model_name: str) -> Optional[str]:
        """
        Get the path to the LoRA checkpoint for a given dataset and model.
        """
        # Add back the 'unsloth_' prefix for folder lookup
        folder_model_name = f"unsloth_{model_name}"
        
        model_folder = self.outputs_unsloth_dir / f"outputs_unsloth_{dataset}_worker" / folder_model_name
        
        if not model_folder.exists():
            print(f"Warning: Model folder not found: {model_folder}")
            return None
        
        # Find checkpoint directory (there should be one)
        checkpoints = [
            d for d in model_folder.iterdir()
            if d.is_dir() and d.name.startswith("checkpoint-")
        ]
        
        if not checkpoints:
            print(f"Warning: No checkpoint found in {model_folder}")
            return None
        
        # Get the checkpoint with the highest step number if multiple exist
        def get_step(checkpoint_dir):
            try:
                return int(checkpoint_dir.name.split("-")[1])
            except (IndexError, ValueError):
                return 0
        
        best_checkpoint = max(checkpoints, key=get_step)
        return str(best_checkpoint)
    
    def get_available_models(self) -> list:
        """Get list of available models from MODEL_MAPPING and Gemini."""
        models = []
        
        # Add vLLM models from MODEL_MAPPING if CUDA is available
        if CUDA_AVAILABLE and MODEL_MAPPING:
            models.extend(list(MODEL_MAPPING.keys()))
        
        # Add Gemini model if available
        if GEMINI_AVAILABLE and os.getenv("GOOGLE_API_KEY"):
            models.append(self.GEMINI_MODEL_NAME)
        
        # Add demo model if CUDA is not available
        if not CUDA_AVAILABLE:
            models.append("demo")
        
        return models
    
    def get_example(self, dataset: str) -> Optional[Dict[str, Any]]:
        """
        Get a random factual sample and one of its actual counterfactuals from the same entry.
        """
        # Map lowercase dataset name to JSON key
        json_dataset = self.dataset_mapping.get(dataset.lower())
        if not json_dataset or json_dataset not in self.counterfactuals_data:
            return None
        
        dataset_data = self.counterfactuals_data[json_dataset]
        if not dataset_data:
            return None
        
        # Collect all entries that have both factual and counterfactuals
        valid_entries = []
        for entry_key, entry_data in dataset_data.items():
            if isinstance(entry_data, dict):
                if "factual" in entry_data and "counterfactuals" in entry_data:
                    counterfactuals = entry_data["counterfactuals"]
                    if isinstance(counterfactuals, list) and len(counterfactuals) > 0:
                        valid_entries.append(entry_data)
        
        if not valid_entries:
            return None
        
        # Randomly select an entry
        selected_entry = random.choice(valid_entries)
        selected_factual = selected_entry["factual"]
        selected_counterfactual = random.choice(selected_entry["counterfactuals"])
        
        return {
            "factual": selected_factual,
            "counterfactual": selected_counterfactual
        }
    
    def get_new_counterfactual(self, dataset: str, factual: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Get a new random counterfactual sample for a given factual instance.
        Finds the factual instance in the data and returns one of its actual counterfactuals.
        """
        # Map lowercase dataset name to JSON key
        json_dataset = self.dataset_mapping.get(dataset.lower())
        if not json_dataset or json_dataset not in self.counterfactuals_data:
            return None
        
        dataset_data = self.counterfactuals_data[json_dataset]
        if not dataset_data:
            return None
        
        # Find the entry that matches the given factual instance
        matching_entry = None
        for entry_key, entry_data in dataset_data.items():
            if isinstance(entry_data, dict) and "factual" in entry_data:
                # Compare factual instances (deep comparison)
                entry_factual = entry_data["factual"]
                if self._dicts_equal(entry_factual, factual):
                    matching_entry = entry_data
                    break
        
        if not matching_entry:
            return None
        
        # Get counterfactuals from the matching entry
        counterfactuals = matching_entry.get("counterfactuals", [])
        if not isinstance(counterfactuals, list) or len(counterfactuals) == 0:
            return None
        
        # Randomly select a counterfactual from this entry's counterfactuals
        selected_counterfactual = random.choice(counterfactuals)
        
        return {
            "factual": factual,
            "counterfactual": selected_counterfactual
        }
    
    def _dicts_equal(self, dict1: Dict[str, Any], dict2: Dict[str, Any]) -> bool:
        """Compare two dictionaries for equality, handling different data types."""
        if set(dict1.keys()) != set(dict2.keys()):
            return False
        
        for key in dict1.keys():
            val1 = dict1[key]
            val2 = dict2[key]
            
            # Handle float comparison with tolerance
            if isinstance(val1, float) and isinstance(val2, float):
                if abs(val1 - val2) > 1e-9:
                    return False
            elif isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                # Compare numeric values
                if abs(float(val1) - float(val2)) > 1e-9:
                    return False
            else:
                # String or other type comparison
                if val1 != val2:
                    return False
        
        return True
    
    def _is_gemini_model(self, model_name: str) -> bool:
        """Check if the model is a Gemini model."""
        return model_name == self.GEMINI_MODEL_NAME or model_name.startswith("gemini-")
    
    def _get_full_model_name(self, model_name: str) -> str:
        """Get the full HuggingFace model name from the short model name."""
        # Check if this is a fine-tuned model (without unsloth_ prefix)
        full_name = f"unsloth_{model_name}"
        if full_name in MODEL_MAPPING:
            return MODEL_MAPPING[full_name]
        
        # Check directly in MODEL_MAPPING
        if model_name in MODEL_MAPPING:
            return MODEL_MAPPING[model_name]
        
        # Try with unsloth prefix variations
        variations = [
            f"unsloth_{model_name}",
            model_name.replace("-", "_"),
            f"unsloth_{model_name.replace('-', '_')}"
        ]
        
        for var in variations:
            if var in MODEL_MAPPING:
                return MODEL_MAPPING[var]
        
        raise ValueError(f"Model {model_name} not found in MODEL_MAPPING")
    
    def _load_vllm_model(self, model_name: str, enable_lora: bool = False) -> Tuple[Any, Any]:
        """
        Load a vLLM model and its tokenizer fresh (no caching).
        Returns (llm, tokenizer) tuple.
        
        Note: The model is loaded fresh each time and should be unloaded
        after use by calling _unload_vllm_model().
        """
        if not VLLM_AVAILABLE:
            raise ValueError("vLLM is not available. Install vllm package.")
        
        if not TRANSFORMERS_AVAILABLE:
            raise ValueError("transformers is not available. Install transformers package.")
        
        # Get the full model path
        hf_model_path = self._get_full_model_name(model_name)
        
        print(f"🔄 Loading model {model_name} from {hf_model_path}...")
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(hf_model_path)
        
        # Load LLM
        llm = LLM(
            model=hf_model_path,
            gpu_memory_utilization=0.6,
            max_model_len=self.default_params["max_model_len"],
            max_num_seqs=1,
            enable_lora=enable_lora,
        )
        
        print(f"✅ Model {model_name} loaded successfully")
        
        return llm, tokenizer
    
    def _unload_vllm_model(self, llm: Any):
        """
        Unload a vLLM model and free GPU memory.
        
        Args:
            llm: The vLLM LLM instance to unload
        """
        try:
            import torch
            import gc
            
            print("🔄 Unloading model from memory...")
            
            # Delete the model
            del llm
            
            # Clear CUDA cache
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
            
            # Run garbage collection
            gc.collect()
            
            print("✅ Model unloaded and GPU memory freed")
            
        except Exception as e:
            print(f"⚠️ Warning: Error during model unloading: {e}")
    
    def _try_load_json_snippet(self, snippet: str) -> Optional[Dict[str, Any]]:
        """Attempt to parse a JSON or Python-literal snippet into a dict."""
        try:
            parsed = json.loads(snippet)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        try:
            parsed = ast.literal_eval(snippet)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        return None
    
    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Parse JSON from LLM response.
        Aligned with llm_kd/src/functions.py extract_and_parse_json logic.
        Looks for fenced ```json``` blocks, then any balanced braces.
        Returns a dict or None.
        """
        if not text:
            return None
        
        candidates: List[str] = []
        
        # 1) fenced json block
        fenced = re.findall(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
        candidates.extend([c.strip() for c in fenced if c.strip()])
        
        # 2) balanced brace scanning
        stack = []
        start_idx = None
        for i, ch in enumerate(text):
            if ch == "{":
                if not stack:
                    start_idx = i
                stack.append(ch)
            elif ch == "}" and stack:
                stack.pop()
                if not stack and start_idx is not None:
                    snippet = text[start_idx : i + 1]
                    candidates.append(snippet.strip())
        
        # Try candidates in reverse order (last JSON block first)
        # Priority 1: Objects with all required keys
        required_keys = {"feature_changes", "reasoning", "features_importance_ranking", "explanation"}
        for cand in reversed(candidates):
            parsed = self._try_load_json_snippet(cand)
            if isinstance(parsed, dict) and required_keys.issubset(parsed.keys()):
                return parsed
        
        # Priority 2: Objects with at least "feature_changes"
        for cand in reversed(candidates):
            parsed = self._try_load_json_snippet(cand)
            if isinstance(parsed, dict) and "feature_changes" in parsed:
                return parsed
        
        # Priority 3: Any dict object
        for cand in reversed(candidates):
            parsed = self._try_load_json_snippet(cand)
            if isinstance(parsed, dict):
                return parsed
        
        return None
    
    def _generate_with_vllm(
        self,
        model_name: str,
        dataset: str,
        prompt_text: str,
        fine_tuned: bool = True,
        temperature: float = 0.6,
        top_p: float = 0.8,
        max_tokens: int = 4096,
        max_retries: int = 2
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Generate explanation using vLLM with optional retry on JSON parse failure.
        
        The model is loaded fresh for each request and unloaded after generation
        to free up GPU memory.
        
        Returns:
            Tuple of (raw_text, parsed_json_or_none)
        """
        llm = None
        
        try:
            # Load model and tokenizer
            llm, tokenizer = self._load_vllm_model(model_name, enable_lora=fine_tuned)
            
            # Create sampling parameters
            sampling_params = SamplingParams(
                temperature=temperature,
                top_p=top_p,
                repetition_penalty=self.default_params["repetition_penalty"],
                max_tokens=max_tokens,
                top_k=10,
                stop=tokenizer.eos_token,
            )
            
            # Get LoRA checkpoint path if fine-tuned
            lora_request = None
            if fine_tuned and LoRARequest is not None:
                checkpoint_path = self._get_lora_checkpoint_path(dataset, model_name)
                if checkpoint_path:
                    lora_request = LoRARequest(
                        "counterfactual_explainability_adapter",
                        1,
                        checkpoint_path,
                    )
                    print(f"Using LoRA checkpoint: {checkpoint_path}")
                else:
                    print(f"Warning: No LoRA checkpoint found, using base model")
            
            # Format prompt with chat template
            messages = [{"role": "user", "content": prompt_text}]
            formatted_prompt = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
            
            generated_text = ""
            parsed_json = None
            
            for attempt in range(max_retries):
                try:
                    # Generate
                    if fine_tuned and lora_request:
                        outputs = llm.generate(
                            [formatted_prompt],
                            sampling_params=sampling_params,
                            lora_request=lora_request,
                        )
                    else:
                        outputs = llm.generate(
                            [formatted_prompt],
                            sampling_params=sampling_params,
                        )
                    
                    generated_text = outputs[0].outputs[0].text.strip()
                    
                    # Try to parse JSON
                    parsed_json = self._parse_json_response(generated_text)
                    
                    if parsed_json is not None:
                        # Successfully parsed JSON
                        print(f"✅ Successfully parsed JSON on attempt {attempt + 1}")
                        break
                    else:
                        print(f"⚠️ Attempt {attempt + 1}: JSON parsing failed, retrying...")
                        
                except Exception as e:
                    print(f"❌ Attempt {attempt + 1} failed with error: {e}")
                    if attempt == max_retries - 1:
                        raise
            
            return generated_text, parsed_json
            
        finally:
            # Always unload the model to free GPU memory
            if llm is not None:
                self._unload_vllm_model(llm)
    
    def _generate_dummy_explanation(
        self,
        factual: Dict[str, Any],
        counterfactual: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a dummy example explanation when CUDA/GPU is not available.
        This mimics the structure of a real explanation with reasoning in <think> tags.
        """
        # Calculate feature changes
        feature_changes = self._calculate_feature_changes(factual, counterfactual)
        target_variable_change = self._extract_target_change(factual, counterfactual)
        
        # Create dummy feature names if needed
        feature_names = list(feature_changes.keys())
        if not feature_names:
            feature_names = ["feature_1", "feature_2", "feature_3"]
            feature_changes = {
                "feature_1": {"factual": "value_A", "counterfactual": "value_B"},
                "feature_2": {"factual": 10, "counterfactual": 15},
                "feature_3": {"factual": "category_X", "counterfactual": "category_Y"}
            }
        
        # Create reasoning text for the redacted_reasoning section
        reasoning_text = """I need to analyze the differences between the factual and counterfactual examples. Let me identify the key feature changes:

1. The first feature changed from its original value to a new value, which likely has a significant impact on the model's prediction.
2. The second feature shows a numerical increase, suggesting a quantitative shift that could influence the outcome.
3. The third feature represents a categorical change that may interact with other features.

Based on these changes, I can see that the combination of modifications creates a shift in the model's decision boundary. The most influential change appears to be the first feature, as it represents a fundamental alteration in the input characteristics. The numerical increase in the second feature amplifies this effect, while the categorical change in the third feature provides additional context that supports the classification shift.

The interaction between these features suggests that the model's decision is not based on a single factor but rather on the combined effect of multiple feature modifications. This aligns with the complex nature of machine learning models that consider multiple dimensions simultaneously."""
        
        # Create the narrative explanation text
        narrative_explanation = f"""The transition from the factual to the counterfactual instance reveals several key modifications that collectively influence the model's classification decision. The primary driver of this change appears to be the alteration in {feature_names[0] if feature_names else 'the primary feature'}, which shifted from its original state to a modified configuration. This fundamental change establishes the foundation for the subsequent classification shift.

Accompanying this primary modification, the numerical adjustment in {feature_names[1] if len(feature_names) > 1 else 'a secondary feature'} further reinforces the directional change in the model's prediction. The quantitative increase represents a meaningful shift that amplifies the impact of the primary feature modification. Additionally, the categorical transformation observed in {feature_names[2] if len(feature_names) > 2 else 'another feature'} provides contextual support for the overall classification change.

The interaction between these modified features demonstrates the model's sensitivity to multi-dimensional changes. Rather than relying on a single factor, the classification outcome emerges from the combined effect of these interconnected modifications. This pattern highlights the complexity of the decision boundary and illustrates how seemingly independent feature changes can collectively produce a significant shift in the model's prediction.

The resulting classification change reflects the model's learned patterns that associate these specific feature combinations with the observed outcome. Understanding these relationships provides valuable insight into the model's decision-making process and the relative importance of different feature modifications in driving classification changes."""
        
        # Create importance ranking
        features_importance_ranking = {}
        for i, feature in enumerate(feature_names[:5]):  # Limit to 5 features
            # Create some variation in rankings (some tied ranks)
            if i < 2:
                features_importance_ranking[feature] = "1"
            elif i < 4:
                features_importance_ranking[feature] = "2"
            else:
                features_importance_ranking[feature] = "3"
        
        # Format feature_changes as a list of dicts (matching the prompt structure)
        feature_changes_list = []
        for feature_name, change in feature_changes.items():
            feature_changes_list.append({feature_name: change})
        
        # Format target_variable_change to match prompt structure (just factual/counterfactual, no variable key)
        if target_variable_change and "factual" in target_variable_change and "counterfactual" in target_variable_change:
            target_var_change = {
                "factual": target_variable_change["factual"],
                "counterfactual": target_variable_change["counterfactual"]
            }
        else:
            target_var_change = {"factual": "class_A", "counterfactual": "class_B"}
        
        # Create the JSON structure matching the prompt format
        json_structure = {
            "feature_changes": feature_changes_list,
            "target_variable_change": target_var_change,
            "reasoning": reasoning_text,
            "features_importance_ranking": features_importance_ranking,
            "explanation": narrative_explanation
        }
        
        # Create the full raw output with redacted_reasoning and JSON block (matching real LLM output)
        raw_output = f"""<think>
{reasoning_text}
</think>
```json
{json.dumps(json_structure, indent=2)}
```"""
        
        # Create metrics for demo mode (all successful)
        from api.models import MetricsResponse
        metrics = MetricsResponse(
            json_parsing_success=True,
            pff=True,  # Perfect Feature Field - demo has all features
            tf=True,   # Target Field - demo has target change
            avg_ff=1.0  # Average Feature Field - perfect score for demo
        )
        
        return {
            "explanation": narrative_explanation,  # Just the narrative text
            "raw_output": raw_output,  # Full output with redacted_reasoning and JSON
            "parsed_json": json_structure,  # The parsed JSON object
            "feature_changes": feature_changes,
            "target_variable_change": target_variable_change,
            "reasoning": reasoning_text,
            "features_importance_ranking": features_importance_ranking,
            "metrics": metrics,
            "status": "demo",
            "warning": "You need GPU CUDA to run models locally. This is just an output example."
        }
    
    def generate_explanation(
        self,
        dataset: str,
        model: str,
        factual: Dict[str, Any],
        counterfactual: Dict[str, Any],
        use_refiner: bool = False,
        fine_tuned: bool = True,
        temperature: float = 0.6,
        top_p: float = 0.8,
        max_tokens: int = 4096
    ) -> Dict[str, Any]:
        """
        Generate a narrative explanation for a factual/counterfactual pair.
        
        Args:
            dataset: Dataset name
            model: Model name (without unsloth_ prefix)
            factual: Factual instance
            counterfactual: Counterfactual instance
            use_refiner: Whether to use refiner (not implemented yet)
            fine_tuned: Whether to use fine-tuned model with LoRA
            temperature: Generation temperature
            top_p: Top-p sampling parameter
            max_tokens: Maximum tokens to generate
        
        Returns:
            Dictionary with explanation, feature_changes, target_variable_change, metrics, etc.
        """
        # Check if this is the demo model
        if model == "demo":
            print("⚠️ Using demo mode. Returning example output.")
            return self._generate_dummy_explanation(factual, counterfactual)
        
        try:
            # Format prompt using the prompt template from llm_kd
            try:
                prompt_text = self._format_prompt(factual, counterfactual, dataset)
            except Exception as e:
                print(f"Error formatting prompt: {e}")
                # Fallback prompt formatting if prompt function is not available
                prompt_text = self._format_fallback_prompt(factual, counterfactual, dataset)
            
            # Check if this is a Gemini model
            if self._is_gemini_model(model):
                generated_text = self._generate_with_gemini(
                    prompt_text,
                    model_name=model,
                    temperature=temperature,
                    top_p=top_p,
                    max_tokens=max_tokens
                )
                parsed_json = self._parse_json_response(generated_text)
            else:
                # Use vLLM with retry logic
                generated_text, parsed_json = self._generate_with_vllm(
                    model_name=model,
                    dataset=dataset,
                    prompt_text=prompt_text,
                    fine_tuned=fine_tuned,
                    temperature=temperature,
                    top_p=top_p,
                    max_tokens=max_tokens,
                    max_retries=2
                )
            
            # Extract explanation from parsed JSON or use raw text
            if parsed_json:
                explanation = parsed_json.get("explanation", generated_text)
                reasoning = parsed_json.get("reasoning")
            else:
                explanation = generated_text
                reasoning = None
            
            # Calculate feature changes (ground truth)
            feature_changes = self._calculate_feature_changes(factual, counterfactual)
            
            # Extract target variable change if available
            target_variable_change = self._extract_target_change(factual, counterfactual)
            
            # Compute metrics
            metrics = self._compute_metrics(parsed_json, feature_changes, target_variable_change, factual, counterfactual)
            
            return {
                "explanation": explanation,
                "raw_output": generated_text,
                "parsed_json": parsed_json,
                "feature_changes": feature_changes,
                "target_variable_change": target_variable_change,
                "reasoning": reasoning,
                "metrics": metrics,
                "status": "success"
            }
            
        except Exception as e:
            raise Exception(f"Error generating explanation: {str(e)}")
    
    def _parse_response(self, text: str) -> Dict[str, Any]:
        """Parse the LLM response, which may be JSON or plain text."""
        parsed = self._parse_json_response(text)
        if parsed:
            return parsed
        return {"explanation": text}
    
    def _calculate_feature_changes(self, factual: Dict[str, Any], counterfactual: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate which features changed between factual and counterfactual."""
        changes = {}
        all_keys = set(factual.keys()) | set(counterfactual.keys())
        
        for key in all_keys:
            factual_val = factual.get(key)
            counterfactual_val = counterfactual.get(key)
            
            if factual_val != counterfactual_val:
                changes[key] = {
                    "factual": factual_val,
                    "counterfactual": counterfactual_val
                }
        
        return changes
    
    def _extract_target_change(self, factual: Dict[str, Any], counterfactual: Dict[str, Any]) -> Dict[str, Any]:
        """Extract target variable change if present."""
        # Common target variable names (case-sensitive first, then case-insensitive)
        target_names = [
            "target", "label", "prediction", "y",  # Generic names
            "Survived", "Income", "MedHouseVal",   # Specific dataset targets
            "income", "survived", "medhouseval"     # Lowercase variants
        ]
        
        # First try exact match
        for target_name in target_names:
            if target_name in factual and target_name in counterfactual:
                if factual[target_name] != counterfactual[target_name]:
                    print(f"📊 Detected target variable: {target_name} ({factual[target_name]} -> {counterfactual[target_name]})")
                    return {
                        "variable": target_name,
                        "factual": factual[target_name],
                        "counterfactual": counterfactual[target_name]
                    }
        
        # Try case-insensitive match
        factual_keys_lower = {k.lower(): k for k in factual.keys()}
        for target_name_lower in [t.lower() for t in target_names]:
            if target_name_lower in factual_keys_lower:
                original_key = factual_keys_lower[target_name_lower]
                if original_key in counterfactual and factual[original_key] != counterfactual[original_key]:
                    print(f"📊 Detected target variable (case-insensitive): {original_key} ({factual[original_key]} -> {counterfactual[original_key]})")
                    return {
                        "variable": original_key,
                        "factual": factual[original_key],
                        "counterfactual": counterfactual[original_key]
                    }
        
        print("⚠️ No target variable detected in factual/counterfactual")
        return {}
    
    def _compute_metrics(
        self,
        parsed_json: Optional[Dict[str, Any]],
        ground_truth_changes: Dict[str, Any],
        ground_truth_target: Dict[str, Any],
        factual: Dict[str, Any],
        counterfactual: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compute metrics for the generated explanation.
        
        Args:
            parsed_json: Parsed JSON from SLM output (or None if parsing failed)
            ground_truth_changes: Feature changes computed from factual/counterfactual (ALL changes including target)
            ground_truth_target: Target variable change (subset of ground_truth_changes)
            factual: Original factual instance
            counterfactual: Original counterfactual instance
        
        Returns:
            Dictionary with metrics: json_parsing_success, pff, tf, avg_ff
        """
        # JP (JSON Parsing) - check if JSON was successfully parsed
        json_parsing_success = parsed_json is not None
        
        if not json_parsing_success:
            print("⚠️ JP Failed: JSON parsing failed")
            return {
                "json_parsing_success": False,
                "pff": False,
                "tf": False,
                "avg_ff": None
            }
        
        # Extract feature_changes from parsed JSON (should be a list of dicts)
        parsed_feature_changes = parsed_json.get("feature_changes", [])
        
        # Convert list of dicts to a single dict for easier comparison
        # Format: [{"age": {"factual": 58, "counterfactual": 86}}, ...] -> {"age": {...}, ...}
        parsed_changes_dict = {}
        if isinstance(parsed_feature_changes, list):
            for item in parsed_feature_changes:
                if isinstance(item, dict):
                    for key, value in item.items():
                        # Normalize key to lowercase for case-insensitive comparison
                        parsed_changes_dict[key.lower().strip()] = value
        elif isinstance(parsed_feature_changes, dict):
            # Already a dict, just normalize keys
            parsed_changes_dict = {k.lower().strip(): v for k, v in parsed_feature_changes.items()}
        
        print(f"📊 Parsed feature changes: {list(parsed_changes_dict.keys())}")
        
        # Ground truth feature names (ALL changes including target, lowercase for comparison)
        ground_truth_keys = set(k.lower().strip() for k in ground_truth_changes.keys())
        parsed_keys = set(parsed_changes_dict.keys())
        
        print(f"📊 Ground truth features: {ground_truth_keys}")
        print(f"📊 Parsed features: {parsed_keys}")
        
        # Calculate feature field scores
        if len(ground_truth_keys) == 0:
            avg_ff = 1.0 if len(parsed_keys) == 0 else 0.0
            pff = len(parsed_keys) == 0
        else:
            # Count how many ground truth features were captured
            captured_features = ground_truth_keys.intersection(parsed_keys)
            avg_ff = len(captured_features) / len(ground_truth_keys)
            
            print(f"📊 Captured features: {captured_features} ({len(captured_features)}/{len(ground_truth_keys)})")
            print(f"📊 AvgFF: {avg_ff:.3f}")
            
            # PFF: Perfect Feature Field - all features captured (including target) AND no extra features
            pff = (captured_features == ground_truth_keys) and (parsed_keys == ground_truth_keys)
            
            if pff:
                print("✅ PFF: Perfect Feature Field")
            else:
                missing = ground_truth_keys - parsed_keys
                extra = parsed_keys - ground_truth_keys
                if missing:
                    print(f"⚠️ PFF Failed: Missing features: {missing}")
                if extra:
                    print(f"⚠️ PFF Failed: Extra features: {extra}")
        
        # TF (Target Field) - check if target variable change is captured in target_variable_change field
        tf = False
        parsed_target = parsed_json.get("target_variable_change", {})
        
        if ground_truth_target and ground_truth_target.get("variable"):
            target_var_name = ground_truth_target.get("variable", "").lower().strip()
            gt_factual = ground_truth_target.get("factual")
            gt_counterfactual = ground_truth_target.get("counterfactual")
            
            print(f"📊 Ground truth target: {target_var_name} = {gt_factual} -> {gt_counterfactual}")
            
            if isinstance(parsed_target, dict) and parsed_target:
                parsed_factual = parsed_target.get("factual")
                parsed_counterfactual = parsed_target.get("counterfactual")
                
                print(f"📊 Parsed target: {parsed_factual} -> {parsed_counterfactual}")
                
                # Convert to strings for comparison (handles int/str mismatches)
                gt_factual_str = str(gt_factual).strip()
                gt_counterfactual_str = str(gt_counterfactual).strip()
                parsed_factual_str = str(parsed_factual).strip()
                parsed_counterfactual_str = str(parsed_counterfactual).strip()
                
                # Check if values match (case-insensitive for strings)
                factual_match = gt_factual_str.lower() == parsed_factual_str.lower()
                counterfactual_match = gt_counterfactual_str.lower() == parsed_counterfactual_str.lower()
                
                tf = factual_match and counterfactual_match
                
                if tf:
                    print("✅ TF: Target Field correct")
                else:
                    if not factual_match:
                        print(f"⚠️ TF Failed: Factual mismatch (GT: {gt_factual_str}, Parsed: {parsed_factual_str})")
                    if not counterfactual_match:
                        print(f"⚠️ TF Failed: Counterfactual mismatch (GT: {gt_counterfactual_str}, Parsed: {parsed_counterfactual_str})")
            else:
                print("⚠️ TF Failed: target_variable_change missing or empty in parsed JSON")
        else:
            # No target in ground truth
            tf = not parsed_target or not isinstance(parsed_target, dict) or len(parsed_target) == 0
            if tf:
                print("✅ TF: No target expected and none provided")
        
        result = {
            "json_parsing_success": json_parsing_success,
            "pff": pff,
            "tf": tf,
            "avg_ff": round(avg_ff, 3) if avg_ff is not None else None
        }
        
        print(f"📊 Final metrics: JP={json_parsing_success}, PFF={pff}, TF={tf}, AvgFF={result['avg_ff']}")
        
        return result
    
    def _generate_with_gemini(
        self,
        prompt_text: str,
        model_name: str,
        temperature: float = 0.6,
        top_p: float = 0.8,
        max_tokens: int = 4096
    ) -> str:
        """Generate explanation using Google Generative AI (Gemini)."""
        if not GEMINI_AVAILABLE:
            raise ValueError("Google Generative AI is not available")
        
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
        
        # Configure generation config
        generation_config = {
            "temperature": temperature,
            "top_p": top_p,
            "max_output_tokens": max_tokens,
        }
        
        # Use the specified Gemini model name (or fallback to default)
        actual_model_name = model_name if model_name.startswith("gemini-") else self.GEMINI_MODEL_NAME
        
        # Use the Gemini model
        gemini_model = genai.GenerativeModel(
            model_name=actual_model_name,
            generation_config=generation_config
        )
        
        # Generate response
        response = gemini_model.generate_content(prompt_text)
        
        # Extract text from response
        if response and response.text:
            return response.text.strip()
        else:
            raise ValueError("No response generated from Gemini")
    
    def _format_prompt(
        self,
        factual: Dict[str, Any],
        counterfactual: Dict[str, Any],
        dataset: str
    ) -> str:
        """Format the prompt using the template from llm_kd."""
        if prompt_template is None:
            return self._format_fallback_prompt(factual, counterfactual, dataset)
        
        # Map dataset name to dataset_kb key
        dataset_key = self.dataset_mapping.get(dataset.lower(), dataset)
        if dataset_key not in dataset_kb:
            # Try with title case
            dataset_key = dataset_key.title()
            if dataset_key not in dataset_kb:
                print(f"Warning: Dataset '{dataset}' not found in dataset_kb, using fallback")
                return self._format_fallback_prompt(factual, counterfactual, dataset)
        
        # Format the prompt template
        formatted_prompt = prompt_template.format(
            dataset_description=dataset_kb[dataset_key],
            factual_example=str(factual),
            counterfactual_example=str(counterfactual)
        )
        
        return formatted_prompt
    
    def _format_fallback_prompt(
        self,
        factual: Dict[str, Any],
        counterfactual: Dict[str, Any],
        dataset: str
    ) -> str:
        """Format a fallback prompt if the prompt template is not available."""
        prompt = f"""Generate a narrative explanation for a counterfactual instance in the {dataset} dataset.

Factual Instance:
{json.dumps(factual, indent=2)}

Counterfactual Instance:
{json.dumps(counterfactual, indent=2)}

Please provide a clear, human-readable explanation of what changed between the factual and counterfactual instances, and why these changes might have occurred. Focus on explaining the differences in a narrative format that is easy to understand.

Your response MUST be a valid JSON object with the following structure:
{{
    "explanation": "<your narrative explanation here>",
    "reasoning": "<your reasoning process>"
}}

Explanation:"""
        return prompt


# Global service instance
pipeline_service = PipelineService()
