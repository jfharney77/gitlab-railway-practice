#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PIDS_FILE="$ROOT_DIR/logs/pids"

stopped=0

kill_pid() {
  local pid="$1" label="$2"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    echo "Stopped $label (PID $pid)."
    stopped=$((stopped + 1))
  fi
}

kill_port() {
  local port="$1" label="$2"
  local pid
  pid=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    kill "$pid"
    echo "Stopped $label on port $port (PID $pid)."
    stopped=$((stopped + 1))
  fi
}

if [ -f "$PIDS_FILE" ]; then
  BACKEND_PID=$(sed -n '1p' "$PIDS_FILE")
  FRONTEND_PID=$(sed -n '2p' "$PIDS_FILE")
  [ -n "$BACKEND_PID" ]  && kill_pid "$BACKEND_PID"  "backend"
  [ -n "$FRONTEND_PID" ] && kill_pid "$FRONTEND_PID" "frontend"
  rm -f "$PIDS_FILE"
else
  # Fallback: kill by port
  kill_port 8000 "backend (uvicorn)"
  kill_port 5173 "frontend (vite)"
  kill_port 3000 "frontend (vite)"
fi

if [ "$stopped" -eq 0 ]; then
  echo "No running processes found."
fi
