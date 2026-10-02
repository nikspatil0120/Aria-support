"""Database seeding with required test orders."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from app.db.models import Order, OrderStatus


DEMO_ORDERS = [
    {
        "id": "ORD-101",
        "customer_name": "Priya Sharma",
        "product": "Vitamin C Serum (30ml)",
        "value": 699.0,
        "status": OrderStatus.OUT_FOR_DELIVERY,
        "courier": "BlueDart",
        "tracking_id": "BD-982103",
        "expected_delivery": "6 PM today",
        "cancellation_eligible": False,
    },
    {
        "id": "ORD-102",
        "customer_name": "Rahul Verma",
        "product": "Hydrating Sunscreen SPF 50",
        "value": 499.0,
        "status": OrderStatus.DELIVERED,
        "courier": "Delhivery",
        "tracking_id": "DL-441029",
        "delivered_date": "14 days ago",
        "cancellation_eligible": False,
    },
    {
        "id": "ORD-103",
        "customer_name": "Ananya Patel",
        "product": "Green Tea Face Wash + Toner",
        "value": 850.0,
        "status": OrderStatus.PROCESSING,
        "order_time": "3 hours ago",
        "cancellation_eligible": True,
    },
]


async def seed_orders(db: AsyncSession) -> None:
    """Insert any missing demo orders without touching customer data."""
    for values in DEMO_ORDERS:
        existing = await db.get(Order, values["id"])
        if existing is None:
            db.add(Order(**values))
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()


async def reset_demo_orders(db: AsyncSession) -> None:
    """Restore the three demo orders to their original state."""
    for values in DEMO_ORDERS:
        order = await db.get(Order, values["id"])
        if order is None:
            db.add(Order(**values))
        else:
            for key, value in values.items():
                setattr(order, key, value)
    await db.commit()
