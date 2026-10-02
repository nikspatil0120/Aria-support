"""Health check endpoint."""
from fastapi import APIRouter

router = APIRouter(prefix="/api")


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
