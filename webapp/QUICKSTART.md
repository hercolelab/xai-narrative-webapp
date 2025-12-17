# Quick Start Guide

## Prerequisites Check

Before starting, make sure you have:
- ✅ Python 3.8+ installed
- ✅ Node.js 16+ installed
- ✅ Git installed
- ✅ `test_counterfactuals.json` file copied to the `webapp/backend/` directory
- ✅ (Optional) Google API Key if you want to use Gemini models
- ✅ (Optional) GPU with CUDA if you want to use vLLM models

## Step-by-Step Setup

### 1. Clone the repository with submodules

```bash
# Clone with submodules (recommended)
git clone --recurse-submodules <xai-narrative-webapp-repo-url>
cd xai-narrative-webapp

# OR if you already cloned without submodules:
git submodule update --init --recursive
```

This will automatically download the `llm_kd` repository as a submodule.

### 2. Navigate to the project directory

```bash
cd xai-narrative-webapp
```

### 3. Copy the data file

Make sure `test_counterfactuals.json` is in the `backend/` directory:

```bash
# If you have the file elsewhere, copy it:
cp /path/to/test_counterfactuals.json backend/test_counterfactuals.json
```

### 4. Set up Backend (FastAPI)

#### Option A: Using the startup script (Recommended)

```bash
./start-backend.sh
```

This script will:
- Create a virtual environment if it doesn't exist
- Install all Python dependencies
- Start the FastAPI server on http://localhost:8000

#### Option B: Manual setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Set up Frontend (React + Vite)

Open a **new terminal window** (keep the backend running), then:

#### Option A: Using the startup script (Recommended)

```bash
cd narrative-explainer-webapp
./start-frontend.sh
```

This script will:
- Install all npm dependencies
- Start the Vite dev server on http://localhost:5173

#### Option B: Manual setup

```bash
cd frontend
npm install
npm run dev
```

### 6. (Optional) Configure Gemini Support

If you want to use Gemini models, set your Google API key:

```bash
export GOOGLE_API_KEY=your_api_key_here
export GEMINI_MODEL_NAME=gemini-2.0-flash-exp  # Optional
```

Or create a `.env` file in the `backend` directory:

```bash
cd backend
cat > .env << EOF
GOOGLE_API_KEY=your_api_key_here
GEMINI_MODEL_NAME=gemini-2.0-flash-exp
EOF
```

### 7. Access the Application

1. Open your browser and go to: **http://localhost:5173**
2. You should see the Counterfactual Narrative Explainer interface

## Using the Application

1. **Select a Dataset**: Choose from adult, titanic, california, or diabetes
2. **Select a Model**: 
   - Choose a vLLM model (if you have the `llm_kd` repository set up)
   - Or choose a Gemini model (if you've set `GOOGLE_API_KEY`)
3. **Load Example**: Click "Load Example" to fetch a random factual/counterfactual pair
4. **Generate Explanation**: Click "Generate Explanation" to create a narrative explanation
5. **View Results**: See the explanation, feature changes, and target variable changes

## Troubleshooting

### Backend won't start

- **Submodule not initialized**: Run `git submodule update --init --recursive` to initialize the llm_kd submodule
- **Import errors**: Make sure the `llm_kd` submodule is initialized (only needed for vLLM models)
- **Port 8000 already in use**: Change the port in `start-backend.sh` or stop the process using port 8000
- **Missing dependencies**: Run `pip install -r requirements.txt` again
- **MODEL_MAPPING empty**: Ensure llm_kd submodule is initialized and check backend logs for import messages

### Frontend won't start

- **Port 5173 already in use**: Vite will automatically use the next available port
- **Node modules issues**: Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Gemini models not showing

- Make sure `GOOGLE_API_KEY` is set in your environment
- Restart the backend server after setting the environment variable
- Check that `google-generativeai` is installed: `pip list | grep google-generativeai`

### No models available

- **For vLLM**: Ensure `llm_kd` repository is accessible and `MODEL_MAPPING` is properly configured
- **For Gemini**: Set `GOOGLE_API_KEY` environment variable

## Running in Production

For production deployment:

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ directory with a web server like nginx
```

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the API documentation at http://localhost:8000/docs when the backend is running
- Check backend logs for error messages

