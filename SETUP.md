# Setup Guide for llm_kd Integration

## ✅ What Has Been Done

1. **llm_kd Submodule**: Added as a Git submodule at `xai-narrative-webapp/llm_kd/`
2. **Path Resolution**: Updated to automatically find llm_kd in the submodule location
3. **Imports**: Configured to import:
   - `MODEL_MAPPING` from `src.utils`
   - `prompt` template from `src.utils`
   - `dataset_kb` from `data.dataset_kb`
4. **Prompt Formatting**: Added `_format_prompt()` method that uses the dataset knowledge base
5. **Error Handling**: Graceful fallbacks if llm_kd is not available

## 🔧 How It Works

The `pipeline_service.py` automatically:
1. Searches for `llm_kd` in multiple locations (submodule location first)
2. Adds it to Python path if found
3. Imports necessary modules from llm_kd
4. Uses the prompt template with dataset knowledge base for better explanations

## 📋 Next Steps for Users

### For First-Time Setup:

```bash
# Clone with submodules
git clone --recurse-submodules <repo-url>
cd xai-narrative-webapp

# Or if already cloned:
git submodule update --init --recursive
```

### For vLLM Models (Optional):

```bash
cd webapp/backend
source venv/bin/activate
pip install vllm  # Requires GPU with CUDA
```

### For Gemini Models (Optional):

```bash
# Set environment variable
export GOOGLE_API_KEY=your_api_key_here
```

## 🔄 Syncing llm_kd Submodule

To update to the latest version:

```bash
cd llm_kd
git pull origin main  # or your branch
cd ..
git add llm_kd
git commit -m "Update llm_kd submodule"
```

To update to a specific commit:

```bash
cd llm_kd
git checkout <commit-hash>
cd ..
git add llm_kd
git commit -m "Update llm_kd to specific commit"
```

## ✅ Verification

After setup, start the backend and check the logs. You should see:
- `✓ Found llm_kd at: /path/to/xai-narrative-webapp/llm_kd`
- `✓ Successfully imported from llm_kd`

If you see warnings, check:
1. Submodule is initialized: `git submodule status`
2. llm_kd directory exists: `ls -la llm_kd/`
3. Required files exist: `ls llm_kd/src/utils.py llm_kd/data/dataset_kb.py`

