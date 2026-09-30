"""SQLAlchemy database models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, DateTime, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
import enum


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


class OrderStatus(str, enum.Enum):
    """Order status enumeration."""
    PROCESSING = "Processing"
    OUT_FOR_DELIVERY = "Out for Delivery"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"


class Order(Base):
    """Order database model."""
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    customer_name: Mapped[str] = mapped_column(String(200))
    product: Mapped[str] = mapped_column(String(500))
    value: Mapped[float] = mapped_column(Float)
    status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus))
    courier: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tracking_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expected_delivery: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    delivered_date: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    order_time: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    cancellation_eligible: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SessionStatus(str, enum.Enum):
    """Call session status enumeration."""
    CREATED = "created"
    CONNECTING = "connecting"
    ACTIVE = "active"
    ENDED = "ended"
    FAILED = "failed"


class CallSession(Base):
    """Call session database model."""
    __tablename__ = "call_sessions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    livekit_room_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[SessionStatus] = mapped_column(SQLEnum(SessionStatus), default=SessionStatus.CREATED)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TranscriptMessage(Base):
    """Transcript message database model."""
    __tablename__ = "transcript_messages"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(50), index=True)
    speaker: Mapped[str] = mapped_column(String(20))  # customer, agent, system
    text: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class IntentType(str, enum.Enum):
    """Customer intent enumeration."""
    ORDER_TRACKING = "ORDER_TRACKING"
    RETURN_REFUND = "RETURN_REFUND"
    CANCELLATION = "CANCELLATION"
    SHIPPING = "SHIPPING"
    COD = "COD"
    GENERAL_SUPPORT = "GENERAL_SUPPORT"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    UNKNOWN = "UNKNOWN"


class ResolutionStatus(str, enum.Enum):
    """Resolution status enumeration."""
    RESOLVED = "RESOLVED"
    PARTIALLY_RESOLVED = "PARTIALLY_RESOLVED"
    UNRESOLVED = "UNRESOLVED"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"


class CallSummary(Base):
    """Call summary database model."""
    __tablename__ = "call_summaries"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    customer_intent: Mapped[IntentType] = mapped_column(SQLEnum(IntentType))
    order_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    resolution_status: Mapped[ResolutionStatus] = mapped_column(SQLEnum(ResolutionStatus))
    call_summary: Mapped[str] = mapped_column(Text)
    policy_used: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
