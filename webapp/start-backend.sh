#!/bin/bash
# Script to start the backend server

cd "$(dirname "$0")/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Verify uvicorn is installed, reinstall if needed
if ! python -m uvicorn --version > /dev/null 2>&1; then
    echo "uvicorn not found, reinstalling dependencies..."
    pip install -r requirements.txt
fi

# Check if port 8000 is already in use
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "Port 8000 is already in use. Killing existing processes..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Start the server using python -m to ensure we use venv's uvicorn
echo "Starting FastAPI server on http://localhost:8000"
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

