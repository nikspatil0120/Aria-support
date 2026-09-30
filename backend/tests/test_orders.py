"""Tests for order service."""
import pytest
from app.services.order_service import get_order_by_id


@pytest.mark.asyncio
async def test_get_order_ord_101(db_session):
    """Test retrieving ORD-101."""
    result = await get_order_by_id(db_session, "ORD-101")
    
    assert result.found is True
    assert result.order_id == "ORD-101"
    assert result.customer_name == "Priya Sharma"
    assert result.product == "Vitamin C Serum (30ml)"
    assert result.value == 699.0
    assert result.status == "Out for Delivery"
    assert result.courier == "BlueDart"
    assert result.tracking_id == "BD-982103"
    assert result.expected_delivery == "6 PM today"
    assert result.cancellation_eligible is False


@pytest.mark.asyncio
async def test_get_order_ord_102(db_session):
    """Test retrieving ORD-102."""
    result = await get_order_by_id(db_session, "ORD-102")
    
    assert result.found is True
    assert result.order_id == "ORD-102"
    assert result.customer_name == "Rahul Verma"
    assert result.product == "Hydrating Sunscreen SPF 50"
    assert result.value == 499.0
    assert result.status == "Delivered"
    assert result.courier == "Delhivery"
    assert result.delivered_date == "14 days ago"
    assert result.cancellation_eligible is False


@pytest.mark.asyncio
async def test_get_order_ord_103(db_session):
    """Test retrieving ORD-103."""
    result = await get_order_by_id(db_session, "ORD-103")
    
    assert result.found is True
    assert result.order_id == "ORD-103"
    assert result.customer_name == "Ananya Patel"
    assert result.product == "Green Tea Face Wash + Toner"
    assert result.value == 850.0
    assert result.status == "Processing"
    assert result.order_time == "3 hours ago"
    assert result.cancellation_eligible is True


@pytest.mark.asyncio
async def test_get_order_not_found(db_session):
    """Test retrieving non-existent order."""
    result = await get_order_by_id(db_session, "ORD-999")
    
    assert result.found is False
    assert result.order_id == "ORD-999"
    assert result.customer_name is None
    assert result.product is None


@pytest.mark.asyncio
async def test_cancellation_eligibility(db_session):
    """Test cancellation eligibility logic."""
    # ORD-103 is Processing - should be eligible
    ord_103 = await get_order_by_id(db_session, "ORD-103")
    assert ord_103.cancellation_eligible is True
    assert ord_103.status == "Processing"
    
    # ORD-101 is Out for Delivery - should NOT be eligible
    ord_101 = await get_order_by_id(db_session, "ORD-101")
    assert ord_101.cancellation_eligible is False
    assert ord_101.status == "Out for Delivery"
    
    # ORD-102 is Delivered - should NOT be eligible
    ord_102 = await get_order_by_id(db_session, "ORD-102")
    assert ord_102.cancellation_eligible is False
    assert ord_102.status == "Delivered"
