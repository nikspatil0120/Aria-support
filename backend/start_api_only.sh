#!/bin/bash
set -e

# Start ONLY FastAPI (no agent worker)
# Agent worker should be deployed as separate Render Background Worker
echo "Starting FastAPI API server only..."
echo "Note: Deploy agent worker separately as Render Background Worker"
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info --workers 1
