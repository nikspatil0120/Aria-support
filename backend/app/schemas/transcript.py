"""Transcript-related Pydantic schemas."""
from pydantic import BaseModel
from datetime import datetime
from typing import List


class TranscriptMessageResponse(BaseModel):
    """Transcript message response schema."""
    id: str
    speaker: str
    text: str
    timestamp: datetime

    class Config:
        from_attributes = True


class TranscriptResponse(BaseModel):
    """Transcript response schema."""
    session_id: str
    messages: List[TranscriptMessageResponse]
