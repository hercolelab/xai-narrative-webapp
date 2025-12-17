#!/bin/bash
# Script to start the backend server

cd "$(dirname "$0")/backend"

# Get absolute path to backend directory
BACKEND_DIR="$(pwd)"
VENV_DIR="$BACKEND_DIR/venv"
VENV_PYTHON="$VENV_DIR/bin/python"
VENV_PIP="$VENV_DIR/bin/pip"

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Install dependencies if needed
if [ ! -f "$VENV_DIR/.installed" ]; then
    echo "Installing dependencies..."
    "$VENV_PIP" install -r requirements.txt
    touch "$VENV_DIR/.installed"
fi

# Verify uvicorn is installed, reinstall if needed
if ! "$VENV_PYTHON" -m uvicorn --version > /dev/null 2>&1; then
    echo "uvicorn not found, reinstalling dependencies..."
    "$VENV_PIP" install -r requirements.txt
fi

# Check if port 8000 is already in use
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "Port 8000 is already in use. Killing existing processes..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Start the server using venv's python directly
echo "Starting FastAPI server on http://localhost:8000"
"$VENV_PYTHON" -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

