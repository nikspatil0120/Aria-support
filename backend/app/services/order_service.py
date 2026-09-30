"""Order service for database operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.db.models import Order, OrderStatus
from app.schemas.order import OrderResponse


async def get_order_by_id(db: AsyncSession, order_id: str) -> OrderResponse:
    """
    Retrieve order details by order ID.
    
    Returns OrderResponse with found=True if order exists,
    or found=False if order doesn't exist.
    """
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        return OrderResponse(found=False, order_id=order_id)
    
    return OrderResponse(
        found=True,
        order_id=order.id,
        customer_name=order.customer_name,
        product=order.product,
        value=order.value,
        status=order.status.value,
        courier=order.courier,
        tracking_id=order.tracking_id,
        expected_delivery=order.expected_delivery,
        delivered_date=order.delivered_date,
        order_time=order.order_time,
        cancellation_eligible=order.cancellation_eligible,
    )


async def cancel_order_in_db(db: AsyncSession, order_id: str) -> bool:
    """
    Set order status to CANCELLED and mark it no longer eligible for cancellation.
    Returns True if the update succeeded, False if order not found.
    """
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        return False

    order.status = OrderStatus.CANCELLED
    order.cancellation_eligible = False
    await db.commit()
    return True


async def list_orders(db: AsyncSession) -> list[Order]:
    """List all orders."""
    result = await db.execute(select(Order))
    return list(result.scalars().all())
