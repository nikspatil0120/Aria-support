"""LiveKit-related API endpoints for token generation."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from livekit import api
from app.db.database import get_db
from app.services.session_service import get_session, update_session_status
from app.db.models import SessionStatus
from app.schemas.session import LiveKitTokenRequest, LiveKitTokenResponse
from app.config import settings
from datetime import datetime, timezone

router = APIRouter(prefix="/api/livekit", tags=["livekit"])


@router.post("/token", response_model=LiveKitTokenResponse)
async def generate_livekit_token(
    request: LiveKitTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a LiveKit access token for a session.
    
    This endpoint securely generates a short-lived token for browser clients
    to connect to LiveKit rooms without exposing API secrets.
    """
    # Verify session exists
    session = await get_session(db, request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.livekit_room_name:
        raise HTTPException(status_code=400, detail="Session has no room name")
    
    try:
        # Generate access token
        token = (
            api.AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
            .with_identity(request.participant_name)
            .with_name(request.participant_name)
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=session.livekit_room_name,
                    can_publish=True,
                    can_subscribe=True,
                )
            )
            .to_jwt()
        )
        
        # Update session status to connecting
        await update_session_status(
            db,
            request.session_id,
            SessionStatus.CONNECTING,
            started_at=datetime.now(timezone.utc),
        )
        
        return LiveKitTokenResponse(
            token=token,
            url=settings.livekit_url,
            room_name=session.livekit_room_name,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate LiveKit token: {str(e)}",
        )
