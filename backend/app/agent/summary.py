"""Post-call structured summary via Groq (JSON mode)."""
from __future__ import annotations

import json
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

INTENTS = [
    "ORDER_TRACKING", "ORDER_CANCELLATION", "RETURN_REFUND", "SHIPPING_INFO",
    "PAYMENT_COD", "PRODUCT_INFO", "OUT_OF_SCOPE", "OTHER",
]
STATUSES = ["RESOLVED", "PARTIALLY_RESOLVED", "UNRESOLVED", "ESCALATION_NEEDED"]

_SYSTEM = f"""You summarize customer support calls for Aura Skincare.
Return ONLY a JSON object with exactly these keys:
- customer_intent: one of {INTENTS}
- order_id: the order id discussed (e.g. "ORD-101") or null
- resolution_status: one of {STATUSES}
- call_summary: 1-3 factual sentences. Do not invent anything not in the transcript.
"""


def _fallback(reason: str) -> dict:
    return {
        "customer_intent": "OTHER",
        "order_id": None,
        "resolution_status": "UNRESOLVED",
        "call_summary": f"Summary unavailable ({reason}).",
    }


async def generate_call_summary(transcript: list[tuple[str, str]]) -> dict:
    """transcript = [(speaker, text), ...] where speaker is 'customer' or 'agent'."""
    if not transcript:
        return {
            "customer_intent": "OTHER",
            "order_id": None,
            "resolution_status": "UNRESOLVED",
            "call_summary": "The call ended before the customer said anything.",
        }

    convo = "\n".join(f"{s.upper()}: {t}" for s, t in transcript)
    payload = {
        "model": settings.groq_llm_model,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": convo},
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{settings.groq_base_url}/chat/completions",
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json=payload,
            )
            r.raise_for_status()
            data = json.loads(r.json()["choices"][0]["message"]["content"])
        if data.get("customer_intent") not in INTENTS:
            data["customer_intent"] = "OTHER"
        if data.get("resolution_status") not in STATUSES:
            data["resolution_status"] = "UNRESOLVED"
        return data
    except Exception as exc:
        logger.error(f"Summary generation failed: {exc}", exc_info=True)
        return _fallback("generation error")
