#!/bin/bash
set -e

# Log startup
echo "Starting Aura Aria Support Backend..."
echo "Memory limit: 512MB (Render free tier)"

# Start LiveKit agent in background with minimal resources
echo "Starting LiveKit agent worker (memory-optimized)..."
python -m app.agent.aria start &
AGENT_PID=$!
echo "Agent PID: $AGENT_PID"

# Give agent time to register with LiveKit
sleep 5

# Start FastAPI in foreground
echo "Starting FastAPI server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info --workers 1 --limit-concurrency 10
