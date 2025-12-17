"""Service for integrating with the LLM pipeline."""
import os
import sys
import json
import random
from typing import Dict, Any, Optional, Tuple
from pathlib import Path

# Add paths to import from llm_kd
# Try multiple possible locations
project_root = Path(__file__).parent.parent.parent  # narrative-explainer-webapp/
possible_paths = [
    project_root.parent / "llm_kd",  # ../llm_kd
    project_root.parent.parent / "llm_kd",  # ../../llm_kd
    project_root / "llm_kd",  # ./llm_kd (if in same directory)
]

for path in possible_paths:
    if path.exists():
        sys.path.insert(0, str(path))
        break

try:
    from vllm import LLM, SamplingParams
    from src.utils import MODEL_MAPPING, prompt
    from src.explainer.test_counterfactuals import test_counterfactuals
except ImportError as e:
    print(f"Warning: Could not import from llm_kd: {e}")
    print("Make sure the llm_kd repository is available at ../llm_kd")
    MODEL_MAPPING = {}
    test_counterfactuals = {}

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
        self.loaded_models: Dict[str, Any] = {}
        self.default_params = {
            "temperature": 0.6,
            "top_p": 0.8,
            "max_tokens": 4096,
            "repetition_penalty": 1.05,
            "max_model_len": 8192
        }
        
        # Load test_counterfactuals.json from backend directory
        backend_dir = Path(__file__).parent.parent
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
    
    def get_available_models(self) -> list:
        """Get list of available models from MODEL_MAPPING and Gemini."""
        models = []
        
        # Add vLLM models from MODEL_MAPPING
        if MODEL_MAPPING:
            models.extend(list(MODEL_MAPPING.keys()))
        
        # Add Gemini model if available
        if GEMINI_AVAILABLE and os.getenv("GOOGLE_API_KEY"):
            models.append(self.GEMINI_MODEL_NAME)
        
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
    
    def _load_model(self, model_name: str) -> Any:
        """Load a model using vLLM or Google Generative AI, with caching."""
        if model_name in self.loaded_models:
            return self.loaded_models[model_name]
        
        # Handle Gemini models
        if self._is_gemini_model(model_name):
            if not GEMINI_AVAILABLE:
                raise ValueError("Google Generative AI is not available. Install google-generativeai package.")
            
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY environment variable is not set.")
            
            # For Gemini, we don't need to "load" the model in the same way
            # We'll just mark it as available
            self.loaded_models[model_name] = "gemini"
            return "gemini"
        
        # Handle vLLM models
        if model_name not in MODEL_MAPPING:
            raise ValueError(f"Model {model_name} not found in MODEL_MAPPING or available Gemini models")
        
        model_path = MODEL_MAPPING[model_name]
        
        # Get GPU settings from environment
        tensor_parallel_size = int(os.getenv("TENSOR_PARALLEL_SIZE", "1"))
        gpu_memory_utilization = float(os.getenv("GPU_MEMORY_UTILIZATION", "0.9"))
        
        print(f"Loading model {model_name} from {model_path}...")
        llm = LLM(
            model=model_path,
            tensor_parallel_size=tensor_parallel_size,
            gpu_memory_utilization=gpu_memory_utilization,
            max_model_len=self.default_params["max_model_len"]
        )
        
        self.loaded_models[model_name] = llm
        return llm
    
    def generate_explanation(
        self,
        dataset: str,
        model: str,
        factual: Dict[str, Any],
        counterfactual: Dict[str, Any],
        use_refiner: bool = False,
        temperature: float = 0.6,
        top_p: float = 0.8,
        max_tokens: int = 4096
    ) -> Dict[str, Any]:
        """
        Generate a narrative explanation for a factual/counterfactual pair.
        
        Args:
            dataset: Dataset name
            model: Model name
            factual: Factual instance
            counterfactual: Counterfactual instance
            use_refiner: Whether to use refiner (not implemented yet)
            temperature: Generation temperature
            top_p: Top-p sampling parameter
            max_tokens: Maximum tokens to generate
        
        Returns:
            Dictionary with explanation, feature_changes, target_variable_change, etc.
        """
        try:
            # Load model (or check if it's Gemini)
            model_instance = self._load_model(model)
            
            # Format prompt using the prompt function from src.utils
            # For Gemini, we'll use the prompt function if available, otherwise format manually
            try:
                prompt_text = prompt(
                    factual=factual,
                    counterfactual=counterfactual,
                    dataset=dataset
                )
            except (NameError, AttributeError):
                # Fallback prompt formatting if prompt function is not available
                prompt_text = self._format_fallback_prompt(factual, counterfactual, dataset)
            
            # Generate explanation based on model type
            if self._is_gemini_model(model):
                generated_text = self._generate_with_gemini(
                    prompt_text,
                    model_name=model,
                    temperature=temperature,
                    top_p=top_p,
                    max_tokens=max_tokens
                )
            else:
                # Use vLLM
                sampling_params = SamplingParams(
                    temperature=temperature,
                    top_p=top_p,
                    max_tokens=max_tokens,
                    repetition_penalty=self.default_params["repetition_penalty"]
                )
                
                outputs = model_instance.generate([prompt_text], sampling_params)
                generated_text = outputs[0].outputs[0].text.strip()
            
            # Try to parse JSON response
            explanation_data = self._parse_response(generated_text)
            
            # Calculate feature changes
            feature_changes = self._calculate_feature_changes(factual, counterfactual)
            
            # Extract target variable change if available
            target_variable_change = self._extract_target_change(factual, counterfactual)
            
            return {
                "explanation": explanation_data.get("explanation", generated_text),
                "feature_changes": feature_changes,
                "target_variable_change": target_variable_change,
                "reasoning": explanation_data.get("reasoning"),
                "status": "success"
            }
            
        except Exception as e:
            raise Exception(f"Error generating explanation: {str(e)}")
    
    def _parse_response(self, text: str) -> Dict[str, Any]:
        """Parse the LLM response, which may be JSON or plain text."""
        # Try to extract JSON if present
        text = text.strip()
        
        # Look for JSON blocks
        if "```json" in text:
            start = text.find("```json") + 7
            end = text.find("```", start)
            if end != -1:
                json_text = text[start:end].strip()
                try:
                    return json.loads(json_text)
                except:
                    pass
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            if end != -1:
                json_text = text[start:end].strip()
                try:
                    return json.loads(json_text)
                except:
                    pass
        
        # Try to parse entire text as JSON
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
        except:
            pass
        
        # If no JSON found, return as plain text explanation
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
        # Common target variable names
        target_names = ["target", "label", "prediction", "y"]
        
        for target_name in target_names:
            if target_name in factual and target_name in counterfactual:
                return {
                    "variable": target_name,
                    "factual": factual[target_name],
                    "counterfactual": counterfactual[target_name]
                }
        
        return {}
    
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
    
    def _format_fallback_prompt(
        self,
        factual: Dict[str, Any],
        counterfactual: Dict[str, Any],
        dataset: str
    ) -> str:
        """Format a fallback prompt if the prompt function is not available."""
        prompt = f"""Generate a narrative explanation for a counterfactual instance in the {dataset} dataset.

Factual Instance:
{json.dumps(factual, indent=2)}

Counterfactual Instance:
{json.dumps(counterfactual, indent=2)}

Please provide a clear, human-readable explanation of what changed between the factual and counterfactual instances, and why these changes might have occurred. Focus on explaining the differences in a narrative format that is easy to understand.

Explanation:"""
        return prompt


# Global service instance
pipeline_service = PipelineService()

