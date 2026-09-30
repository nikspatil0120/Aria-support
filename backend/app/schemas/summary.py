"""Summary-related Pydantic schemas."""
from pydantic import BaseModel
from typing import Optional


class CallSummaryResponse(BaseModel):
    """Call summary response schema."""
    customer_intent: str
    order_id: Optional[str] = None
    resolution_status: str
    call_summary: str
    policy_used: Optional[str] = None
    duration_seconds: Optional[int] = None

    class Config:
        from_attributes = True
