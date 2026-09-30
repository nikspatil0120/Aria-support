"""Order-related API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.order_service import get_order_by_id, list_orders
from app.schemas.order import OrderResponse

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, db: AsyncSession = Depends(get_db)):
    """Get order details by order ID."""
    return await get_order_by_id(db, order_id)


@router.get("/", response_model=list[OrderResponse])
async def get_orders(db: AsyncSession = Depends(get_db)):
    """List all orders."""
    orders = await list_orders(db)
    return [
        OrderResponse(
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
        for order in orders
    ]
