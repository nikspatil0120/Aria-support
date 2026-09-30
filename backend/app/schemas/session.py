"""Session-related Pydantic schemas."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionCreate(BaseModel):
    """Schema for creating a new session."""
    pass


class SessionResponse(BaseModel):
    """Session response schema."""
    id: str
    livekit_room_name: Optional[str] = None
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LiveKitTokenRequest(BaseModel):
    """Request schema for LiveKit token generation."""
    session_id: str
    participant_name: str = "customer"


class LiveKitTokenResponse(BaseModel):
    """Response schema for LiveKit token."""
    token: str
    url: str
    room_name: str
