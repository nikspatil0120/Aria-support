"""Order-related Pydantic schemas."""
from pydantic import BaseModel
from typing import Optional


class OrderResponse(BaseModel):
    """Order response schema."""
    found: bool
    order_id: str
    customer_name: Optional[str] = None
    product: Optional[str] = None
    value: Optional[float] = None
    status: Optional[str] = None
    courier: Optional[str] = None
    tracking_id: Optional[str] = None
    expected_delivery: Optional[str] = None
    delivered_date: Optional[str] = None
    order_time: Optional[str] = None
    cancellation_eligible: Optional[bool] = None

    class Config:
        from_attributes = True
