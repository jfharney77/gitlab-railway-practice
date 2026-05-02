#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv"

cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment at backend/.venv..."
  python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment (cross-platform)
if [ -f "$VENV_DIR/Scripts/activate" ]; then
  source "$VENV_DIR/Scripts/activate"
else
  source "$VENV_DIR/bin/activate"
fi

# Install dependencies
if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt -q
elif [ -f "pyproject.toml" ]; then
  pip install -e . -q
fi

# Copy .env.example to .env if needed
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Copied .env.example to backend/.env — please review it before continuing."
fi

exec uvicorn main:app --reload --host 0.0.0.0 --port 8000
