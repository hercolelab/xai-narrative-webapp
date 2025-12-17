# Counterfactual Narrative Explainer Web Application

A modern web application for generating counterfactual narrative explanations using an LLM pipeline. The application consists of a FastAPI backend and a React frontend with a clean, responsive UI.

## Project Structure

```
narrative-explainer-webapp/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application
│   │   └── models.py        # Pydantic request/response models
│   ├── services/
│   │   ├── __init__.py
│   │   └── pipeline_service.py  # Service to wrap the LLM pipeline
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DatasetSelector.jsx
│   │   │   ├── ModelSelector.jsx
│   │   │   ├── DataDisplay.jsx
│   │   │   └── ExplanationDisplay.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

## Features

- **Dataset Selection**: Choose from available datasets (adult, titanic, california, diabetes)
- **Model Selection**: Select from available models (vLLM models from MODEL_MAPPING or Gemini models via Google Generative AI)
- **Example Loading**: Fetch random factual and counterfactual samples (selected independently) for testing
- **Explanation Generation**: Generate narrative explanations using the LLM pipeline (supports both vLLM and Google Generative AI)
- **Feature Highlighting**: Visualize differences between factual and counterfactual instances
- **History Tracking**: View recent explanations (stored in browser localStorage)
- **Copy to Clipboard**: Easy copying of generated explanations
- **Responsive Design**: Works on desktop and tablet devices
- **Multi-Provider Support**: Use either local vLLM models (GPU required) or cloud-based Gemini models (API key required)

## Prerequisites

- Python 3.8+
- Node.js 16+
- Access to the `llm_kd` repository (should be at `../llm_kd` relative to this project)
- GPU with CUDA support (for vLLM models, optional if using Gemini)
- Google API Key (for Gemini models, optional if using vLLM)

## Backend Setup

1. Navigate to the backend directory:
```bash
cd narrative-explainer-webapp/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

   **For Gemini support**, add your Google API key:
   ```bash
   GOOGLE_API_KEY=your_api_key_here
   GEMINI_MODEL_NAME=gemini-2.0-flash-exp  # Optional, defaults to gemini-2.0-flash-exp
   # You can use any Gemini model name, e.g., gemini-2.5-flash-lite, gemini-pro, etc.
   ```
   
   You can get a Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey).
   
   **Note:** Any model name starting with "gemini-" will be automatically routed to Google Generative AI, so you can use any available Gemini model by setting `GEMINI_MODEL_NAME` or by selecting a Gemini model in the frontend (if it's configured).

5. **Copy the data file** (if not already present):
   ```bash
   # The test_counterfactuals.json file should be in the backend directory
   # If you have it elsewhere, copy it:
   cp /path/to/test_counterfactuals.json backend/test_counterfactuals.json
   ```
   
   The application will automatically load this file to provide factual and counterfactual samples.

6. Ensure the `llm_kd` repository is accessible (only needed for vLLM models):
   - The backend expects to import from `src.utils` and `src.explainer.test_counterfactuals`
   - Make sure the parent directory contains the `llm_kd` repository
   - **Note:** If `test_counterfactuals.json` is in the backend directory, the app will use that instead of importing from `llm_kd`

7. Start the FastAPI server:
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd narrative-explainer-webapp/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### GET `/api/datasets`
Returns available datasets.

**Response:**
```json
{
  "datasets": ["adult", "titanic", "california", "diabetes"]
}
```

### GET `/api/models`
Returns available models from MODEL_MAPPING and Gemini (if configured).

**Response:**
```json
{
  "models": ["qwen_3B", "model2", "gemini-2.0-flash-exp", ...]
}
```

Note: Gemini models will only appear if `GOOGLE_API_KEY` is set in the environment.

### GET `/api/examples/{dataset}`
Returns a random factual/counterfactual pair for the selected dataset.

**Response:**
```json
{
  "factual": {"age": 39, "workclass": "State-gov", ...},
  "counterfactual": {"age": 39, "workclass": "Self-emp-not-inc", ...}
}
```

### POST `/api/explain`
Generates a narrative explanation.

**Request:**
```json
{
  "dataset": "adult",
  "model": "qwen_3B",
  "factual": {"age": 39, "workclass": "State-gov", ...},
  "counterfactual": {"age": 39, "workclass": "Self-emp-not-inc", ...},
  "use_refiner": false,
  "temperature": 0.6,
  "top_p": 0.8,
  "max_tokens": 4096
}
```

**Note:** You can use either vLLM models (from MODEL_MAPPING) or Gemini models (e.g., `gemini-2.0-flash-exp`). The API will automatically route to the appropriate service.

**Response:**
```json
{
  "explanation": "The generated narrative explanation text...",
  "feature_changes": {
    "workclass": {
      "factual": "State-gov",
      "counterfactual": "Self-emp-not-inc"
    }
  },
  "target_variable_change": {
    "variable": "target",
    "factual": 0,
    "counterfactual": 1
  },
  "reasoning": "...",
  "status": "success"
}
```

## Configuration

### Backend Environment Variables

**vLLM Configuration:**
- `TENSOR_PARALLEL_SIZE`: Number of GPUs for tensor parallelism (default: 1)
- `GPU_MEMORY_UTILIZATION`: GPU memory utilization (default: 0.9)

**Gemini Configuration:**
- `GOOGLE_API_KEY`: Your Google API key for Gemini models (required for Gemini support)
- `GEMINI_MODEL_NAME`: Gemini model name to use (default: `gemini-2.0-flash-exp`). Can be set to `gemini-2.0-flash-exp` or other available Gemini models.

**API Configuration:**
- `API_HOST`: API host (default: 0.0.0.0)
- `API_PORT`: API port (default: 8000)

### Frontend Environment Variables

Create a `.env` file in the frontend directory:
```
VITE_API_URL=http://localhost:8000
```

## Usage

1. Start both backend and frontend servers
2. Open the frontend in your browser (`http://localhost:5173`)
3. Select a dataset from the dropdown
4. Select a model from the dropdown:
   - **vLLM models**: Models from MODEL_MAPPING (requires GPU)
   - **Gemini models**: `gemini-2.0-flash-exp` or other Gemini models (requires GOOGLE_API_KEY)
5. Click "Load Example" to fetch a random factual/counterfactual pair
6. Review the factual and counterfactual instances
7. Click "Generate Explanation" to create a narrative explanation
8. View the explanation, feature changes, and target variable changes
9. Use "New Example" to load a different pair
10. Copy explanations to clipboard using the copy button

## Development

### Backend Development

The backend uses FastAPI with automatic reloading. Changes to Python files will trigger a reload.

### Frontend Development

The frontend uses Vite for fast hot module replacement. Changes to React components will update automatically.

## Troubleshooting

### Backend Issues

- **Import errors**: Ensure the `llm_kd` repository is accessible at the expected path (only needed for vLLM models)
- **GPU errors**: Check CUDA installation and GPU availability (only needed for vLLM models)
- **Model loading errors**: Verify model paths in MODEL_MAPPING (for vLLM models)
- **Gemini not appearing**: Ensure `GOOGLE_API_KEY` is set in your environment variables
- **Gemini API errors**: Verify your API key is valid and has proper permissions. Check Google AI Studio for API status

### Frontend Issues

- **API connection errors**: Ensure the backend is running and CORS is configured correctly
- **Build errors**: Clear `node_modules` and reinstall dependencies

## License

This project is part of a research project. Please refer to the main repository for license information.

