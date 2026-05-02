#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$ROOT_DIR/logs"

mkdir -p "$LOGS_DIR"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Shutting down..."
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID"
  fi
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID"
  fi
  rm -f "$LOGS_DIR/pids"
}

trap cleanup SIGINT SIGTERM

echo "Starting backend (logs → logs/backend.log)..."
bash "$SCRIPT_DIR/start_backend.sh" > "$LOGS_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

echo "Starting frontend..."
bash "$SCRIPT_DIR/start_frontend.sh" &
FRONTEND_PID=$!

printf '%s\n%s\n' "$BACKEND_PID" "$FRONTEND_PID" > "$LOGS_DIR/pids"
echo "PIDs written to logs/pids (backend: $BACKEND_PID, frontend: $FRONTEND_PID)"

wait "$FRONTEND_PID"
