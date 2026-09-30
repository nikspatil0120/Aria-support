"""Transcript service for managing conversation transcripts."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from app.db.models import TranscriptMessage


async def add_transcript_message(
    db: AsyncSession,
    session_id: str,
    speaker: str,
    text: str,
) -> TranscriptMessage:
    """Add a new transcript message."""
    message = TranscriptMessage(
        id=f"msg_{uuid.uuid4().hex[:12]}",
        session_id=session_id,
        speaker=speaker,
        text=text,
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def get_transcript(db: AsyncSession, session_id: str) -> List[TranscriptMessage]:
    """Get all transcript messages for a session."""
    result = await db.execute(
        select(TranscriptMessage)
        .where(TranscriptMessage.session_id == session_id)
        .order_by(TranscriptMessage.timestamp)
    )
    return list(result.scalars().all())
