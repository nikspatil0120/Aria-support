"""Aura Skincare brand policies."""

AURA_POLICIES = """
## AURA SKINCARE POLICIES

### SHIPPING POLICY
- FREE delivery on orders above ₹499
- Orders below ₹499 have a ₹50 shipping fee
- Standard delivery takes 3-5 business days

### RETURNS & REFUNDS POLICY
- Returns accepted within 7 days of delivery
- Product must be UNOPENED
- Product must be UNUSED
- Product must be in ORIGINAL PACKAGING
- If conditions are not met, return is NOT eligible

### DAMAGED OR DEFECTIVE PRODUCTS
- Must be reported within 48 hours of delivery
- Customer must provide photos
- Resolution: REPLACEMENT (not refund)

### CANCELLATION POLICY
- Orders can be cancelled ONLY while status is "Processing"
- Once order status is "Shipped" or "Out for Delivery", it CANNOT be cancelled
- Customer may refuse delivery at the doorstep if order is already shipped

### CASH ON DELIVERY (COD)
- COD available for orders up to ₹2,500
- Customer can pay by cash or UPI at the doorstep

### IMPORTANT GUARDRAILS
- NEVER promise a return/refund if the policy conditions are not met
- NEVER say an order can be cancelled if it's already shipped or out for delivery
- ALWAYS check order status before stating cancellation eligibility
- NEVER hallucinate order information - always use the get_order_details tool
- If customer request is outside policy, politely explain the policy limitation
"""


def get_shipping_policy() -> str:
    """Get shipping policy information."""
    return """
Shipping Policy:
- Free delivery on orders above ₹499
- ₹50 shipping fee for orders below ₹499
- Standard delivery: 3-5 business days
"""


def get_return_policy() -> str:
    """Get return and refund policy information."""
    return """
Returns & Refunds Policy:
- Returns accepted within 7 days of delivery
- Product must be unopened, unused, and in original packaging
- Damaged/defective products: Report within 48 hours with photos for replacement
"""


def get_cancellation_policy() -> str:
    """Get cancellation policy information."""
    return """
Cancellation Policy:
- Orders can be cancelled only while in "Processing" status
- Once shipped or out for delivery, cancellation is not possible
- You may refuse delivery at your doorstep if order is already dispatched
"""


def get_cod_policy() -> str:
    """Get Cash on Delivery policy information."""
    return """
Cash on Delivery (COD) Policy:
- Available for orders up to ₹2,500
- Pay by cash or UPI at your doorstep
"""
