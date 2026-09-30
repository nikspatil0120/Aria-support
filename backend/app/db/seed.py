"""Database seeding with required test orders."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Order, OrderStatus


async def seed_orders(db: AsyncSession) -> None:
    """Seed the database with the three required test orders."""
    
    # Check if orders already exist
    result = await db.execute(select(Order))
    existing = result.scalars().all()
    
    if len(existing) > 0:
        print(f"Database already contains {len(existing)} orders. Skipping seed.")
        return
    
    # Create the three required test orders
    orders = [
        Order(
            id="ORD-101",
            customer_name="Priya Sharma",
            product="Vitamin C Serum (30ml)",
            value=699.0,
            status=OrderStatus.OUT_FOR_DELIVERY,
            courier="BlueDart",
            tracking_id="BD-982103",
            expected_delivery="6 PM today",
            cancellation_eligible=False,
        ),
        Order(
            id="ORD-102",
            customer_name="Rahul Verma",
            product="Hydrating Sunscreen SPF 50",
            value=499.0,
            status=OrderStatus.DELIVERED,
            courier="Delhivery",
            tracking_id="DL-441029",
            delivered_date="14 days ago",
            cancellation_eligible=False,
        ),
        Order(
            id="ORD-103",
            customer_name="Ananya Patel",
            product="Green Tea Face Wash + Toner",
            value=850.0,
            status=OrderStatus.PROCESSING,
            order_time="3 hours ago",
            cancellation_eligible=True,
        ),
    ]
    
    db.add_all(orders)
    await db.commit()
    print(f"Successfully seeded {len(orders)} test orders.")
