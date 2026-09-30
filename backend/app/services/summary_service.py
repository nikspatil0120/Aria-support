"""Summary service for managing call summaries."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from app.db.models import CallSummary, IntentType, ResolutionStatus


async def create_summary(
    db: AsyncSession,
    session_id: str,
    customer_intent: IntentType,
    resolution_status: ResolutionStatus,
    call_summary: str,
    order_id: Optional[str] = None,
    policy_used: Optional[str] = None,
    duration_seconds: Optional[int] = None,
) -> CallSummary:
    """Create a call summary."""
    summary = CallSummary(
        id=f"sum_{uuid.uuid4().hex[:12]}",
        session_id=session_id,
        customer_intent=customer_intent,
        order_id=order_id,
        resolution_status=resolution_status,
        call_summary=call_summary,
        policy_used=policy_used,
        duration_seconds=duration_seconds,
    )
    
    db.add(summary)
    await db.commit()
    await db.refresh(summary)
    return summary


async def get_summary_by_session(db: AsyncSession, session_id: str) -> Optional[CallSummary]:
    """Get call summary by session ID."""
    result = await db.execute(
        select(CallSummary).where(CallSummary.session_id == session_id)
    )
    return result.scalar_one_or_none()
