"""Session service for managing call sessions."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional
import uuid
from app.db.models import CallSession, SessionStatus


async def create_session(db: AsyncSession) -> CallSession:
    """Create a new call session."""
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    room_name = f"aria_support_{session_id}"
    
    session = CallSession(
        id=session_id,
        livekit_room_name=room_name,
        status=SessionStatus.CREATED,
    )
    
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: str) -> Optional[CallSession]:
    """Get session by ID."""
    result = await db.execute(
        select(CallSession).where(CallSession.id == session_id)
    )
    return result.scalar_one_or_none()


async def update_session_status(
    db: AsyncSession,
    session_id: str,
    status: SessionStatus,
    started_at: Optional[datetime] = None,
    ended_at: Optional[datetime] = None,
) -> Optional[CallSession]:
    """Update session status and timestamps."""
    session = await get_session(db, session_id)
    if not session:
        return None
    
    session.status = status
    if started_at:
        session.started_at = started_at
    if ended_at:
        session.ended_at = ended_at
        if session.started_at:
            session.duration_seconds = int((ended_at - session.started_at).total_seconds())
    
    await db.commit()
    await db.refresh(session)
    return session
