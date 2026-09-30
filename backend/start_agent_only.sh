#!/bin/bash
set -e

# Start ONLY LiveKit agent worker (no FastAPI)
# This should be deployed as separate Render Background Worker
echo "Starting LiveKit agent worker only..."
echo "Memory-optimized for Render free tier (512MB)"
exec python -m app.agent.aria start
