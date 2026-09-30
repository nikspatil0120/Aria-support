"""Tool definitions for Aria agent."""
from typing import Dict, Any
import json


# Tool schema for get_order_details
GET_ORDER_DETAILS_TOOL = {
    "name": "get_order_details",
    "description": "Retrieve order details from the database using an order ID. Use this whenever the customer mentions an order ID or asks about an order. Returns order information including status, tracking, and customer details.",
    "parameters": {
        "type": "object",
        "properties": {
            "order_id": {
                "type": "string",
                "description": "The order ID, typically in format ORD-XXX (e.g., ORD-101)",
            }
        },
        "required": ["order_id"],
    },
}


def format_tool_declaration_for_gemini() -> Dict[str, Any]:
    """Format tool declaration for Gemini function calling."""
    return {
        "function_declarations": [
            {
                "name": GET_ORDER_DETAILS_TOOL["name"],
                "description": GET_ORDER_DETAILS_TOOL["description"],
                "parameters": GET_ORDER_DETAILS_TOOL["parameters"],
            }
        ]
    }


def format_order_result_for_llm(order_data: Dict[str, Any]) -> str:
    """
    Format order data into a clear text response for the LLM.
    
    The LLM will receive this text and synthesize a natural spoken response.
    """
    if not order_data.get("found"):
        return f"Order {order_data.get('order_id', 'unknown')} was not found in the database."
    
    result = f"Order {order_data['order_id']} found:\n"
    result += f"Customer: {order_data.get('customer_name', 'Unknown')}\n"
    result += f"Product: {order_data.get('product', 'Unknown')}\n"
    result += f"Value: ₹{order_data.get('value', 0)}\n"
    result += f"Status: {order_data.get('status', 'Unknown')}\n"
    
    if order_data.get('courier'):
        result += f"Courier: {order_data['courier']}\n"
    if order_data.get('tracking_id'):
        result += f"Tracking ID: {order_data['tracking_id']}\n"
    if order_data.get('expected_delivery'):
        result += f"Expected Delivery: {order_data['expected_delivery']}\n"
    if order_data.get('delivered_date'):
        result += f"Delivered: {order_data['delivered_date']}\n"
    if order_data.get('order_time'):
        result += f"Ordered: {order_data['order_time']}\n"
    
    result += f"Cancellation Eligible: {'Yes' if order_data.get('cancellation_eligible') else 'No'}\n"
    
    return result
