#!/bin/bash
set -e

# Log startup
echo "Starting Aura Aria Support Backend..."
echo "Memory limit: 512MB (Render free tier)"

# Start LiveKit agent in background
echo "Starting LiveKit agent worker..."
python -m app.agent.aria start &
AGENT_PID=$!
echo "Agent PID: $AGENT_PID"

# Give agent a moment to start
sleep 3

# Start FastAPI in foreground
echo "Starting FastAPI server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info
