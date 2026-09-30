"""Session-related API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.session_service import create_session, get_session
from app.services.transcript_service import get_transcript
from app.services.summary_service import get_summary_by_session
from app.schemas.session import SessionCreate, SessionResponse
from app.schemas.transcript import TranscriptResponse, TranscriptMessageResponse
from app.schemas.summary import CallSummaryResponse

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/", response_model=SessionResponse)
async def create_new_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new call session."""
    session = await create_session(db)
    return session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session_details(session_id: str, db: AsyncSession = Depends(get_db)):
    """Get session details by ID."""
    session = await get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/transcript", response_model=TranscriptResponse)
async def get_session_transcript(session_id: str, db: AsyncSession = Depends(get_db)):
    """Get transcript for a session."""
    # Verify session exists
    session = await get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = await get_transcript(db, session_id)
    return TranscriptResponse(
        session_id=session_id,
        messages=[
            TranscriptMessageResponse(
                id=msg.id,
                speaker=msg.speaker,
                text=msg.text,
                timestamp=msg.timestamp,
            )
            for msg in messages
        ],
    )


@router.get("/{session_id}/summary", response_model=CallSummaryResponse)
async def get_session_summary(session_id: str, db: AsyncSession = Depends(get_db)):
    """Get call summary for a session."""
    summary = await get_summary_by_session(db, session_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary
