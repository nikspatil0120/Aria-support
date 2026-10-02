"""Aria voice agent - LiveKit Agents + Groq (STT + LLM) + edge-tts.

Pipeline:
    Browser mic (WebRTC) -> LiveKit Cloud -> Silero VAD (turn detection)
    -> Groq Whisper large-v3-turbo (STT, ~300-500ms)
    -> Groq Llama 3.3 70B (LLM + get_order_details tool)
    -> edge-tts en-IN-NeerjaNeural (Indian English TTS, sentence-streamed)
    -> LiveKit Cloud -> Browser speaker

State + transcript are pushed to the browser over the LiveKit data channel.
At call end, an LLM call produces the structured JSON summary.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from datetime import datetime, timezone

import httpx
import psutil
from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    JobExecutorType,
    WorkerOptions,
    cli,
    function_tool,
    voice,
)
from livekit.agents import tts as agents_tts
from livekit.plugins import openai as lk_openai
from livekit.plugins import silero

from app.agent.edge_tts_plugin import EdgeTTS
from app.agent.prompts import get_aria_system_prompt
from app.agent.summary import generate_call_summary
from app.agent.tools import format_order_result_for_llm
from app.config import settings
from app.db.database import AsyncSessionLocal
from app.db.models import SessionStatus
from app.services.order_service import cancel_order_in_db, get_order_by_id
from app.services.session_service import update_session_status
from app.services.transcript_service import add_transcript_message

logger = logging.getLogger(__name__)


def _rss_mb() -> float:
    return psutil.Process().memory_info().rss / 1024 / 1024

# ---------------------------------------------------------------------------
# Whisper hallucination filter
# Whisper reliably hallucinates these on silence/background noise.
# Matching is case-insensitive against the stripped, punctuation-trimmed text.
# ---------------------------------------------------------------------------
_HALLUCINATIONS = frozenset({
    "thank you", "thanks", "bye", "goodbye", "see you", "see you later",
    "you", "okay", "ok", "hmm", "um", "uh", "ah", "oh",
    "sure", "yes", "no", "i see", "right",
    "thank you for watching", "thanks for watching", "please subscribe",
    "we quit doing it", "we quit", "simon", "absolutely",
    "please like and subscribe", "don't forget to subscribe",
    # User mentioned these specifically
    "but yeah", "all right", "alright", "it's a good time",
})

def _is_hallucination(text: str) -> bool:
    """Return True if the transcript looks like a Whisper hallucination."""
    normalized = text.lower().strip().rstrip(".,!?…")
    if normalized in _HALLUCINATIONS:
        return True
    # Sub-3-char fragments are almost always noise
    if len(normalized) < 3:
        return True
    # Partial matches for phrases
    hallucination_phrases = ["it's a good time", "but yeah"]
    for phrase in hallucination_phrases:
        if phrase in normalized:
            return True
    return False


async def _send_data(room: rtc.Room, payload: dict) -> None:
    try:
        await room.local_participant.publish_data(
            json.dumps(payload).encode("utf-8"), reliable=True
        )
    except Exception as exc:
        logger.warning(f"Data channel send failed: {exc}")


async def _save_message(session_id: str, speaker: str, text: str) -> None:
    try:
        async with AsyncSessionLocal() as db:
            await add_transcript_message(db, session_id, speaker, text)
    except Exception as exc:
        logger.error(f"Failed to save transcript message: {exc}")


async def _persist_summary(session_id: str, summary: dict) -> None:
    """Write the Groq-generated summary to call_summaries and mark session ENDED."""
    logger.info(f"Persisting summary for {session_id}: {json.dumps(summary)}")
    try:
        from app.db.models import IntentType, ResolutionStatus
        from app.services.summary_service import create_summary
        from app.services.session_service import get_session
        
        # Map Groq intent string -> DB enum
        intent_map = {
            "ORDER_TRACKING": IntentType.ORDER_TRACKING,
            "ORDER_CANCELLATION": IntentType.CANCELLATION,
            "RETURN_REFUND": IntentType.RETURN_REFUND,
            "SHIPPING_INFO": IntentType.SHIPPING,
            "PAYMENT_COD": IntentType.COD,
            "PRODUCT_INFO": IntentType.GENERAL_SUPPORT,
            "OUT_OF_SCOPE": IntentType.OUT_OF_SCOPE,
            "OTHER": IntentType.UNKNOWN,
        }
        resolution_map = {
            "RESOLVED": ResolutionStatus.RESOLVED,
            "PARTIALLY_RESOLVED": ResolutionStatus.PARTIALLY_RESOLVED,
            "UNRESOLVED": ResolutionStatus.UNRESOLVED,
            "ESCALATION_NEEDED": ResolutionStatus.UNRESOLVED,
        }
        async with AsyncSessionLocal() as db:
            # Get session to calculate duration
            session = await get_session(db, session_id)
            duration_seconds = None
            if session and session.started_at:
                ended_at = datetime.now(timezone.utc)
                duration_seconds = int((ended_at - session.started_at).total_seconds())
            
            await create_summary(
                db,
                session_id=session_id,
                customer_intent=intent_map.get(summary.get("customer_intent", ""), IntentType.UNKNOWN),
                resolution_status=resolution_map.get(summary.get("resolution_status", ""), ResolutionStatus.UNRESOLVED),
                call_summary=summary.get("call_summary", ""),
                order_id=summary.get("order_id"),
                duration_seconds=duration_seconds,
            )
            await update_session_status(db, session_id, SessionStatus.ENDED, ended_at=datetime.now(timezone.utc))
        logger.info(f"Summary persisted and session {session_id} marked ENDED")
    except Exception as exc:
        logger.error(f"Failed to persist summary for {session_id}: {exc}", exc_info=True)


def prewarm(proc: JobProcess) -> None:
    """Load Silero once per worker process so calls start instantly."""
    proc.userdata["vad"] = silero.VAD.load(
        min_speech_duration=0.3,      # was 0.1 — filters sub-300ms noise bursts
        min_silence_duration=0.5,
        prefix_padding_duration=0.3,
        sample_rate=8000,
        force_cpu=True,
    )


async def entrypoint(ctx: JobContext) -> None:
    room_name = ctx.room.name
    logger.info(f"Agent starting for room: {room_name}")
    logger.info(f"[mem] rss={_rss_mb():.1f}MB")
    peak_rss = _rss_mb()

    async def _memory_monitor() -> None:
        nonlocal peak_rss
        while True:
            await asyncio.sleep(30)
            current_rss = _rss_mb()
            peak_rss = max(peak_rss, current_rss)
            logger.info(f"[mem] rss={current_rss:.1f}MB")

    memory_monitor = asyncio.create_task(_memory_monitor())

    session_id: str | None = None
    if room_name.startswith("aria_support_"):
        session_id = room_name.removeprefix("aria_support_")
        try:
            async with AsyncSessionLocal() as db:
                await update_session_status(
                    db, session_id, SessionStatus.ACTIVE, started_at=datetime.now(timezone.utc)
                )
        except Exception as exc:
            logger.error(f"Failed to mark session active: {exc}")

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # ---- Providers (all free tier) -----------------------------------------
    stt = lk_openai.STT(
        model=settings.groq_stt_model,
        language=settings.stt_language,
        base_url=settings.groq_base_url,
        api_key=settings.groq_api_key,
    )
    llm = lk_openai.LLM(
        model=settings.groq_llm_model,
        base_url=settings.groq_base_url,
        api_key=settings.groq_api_key,
        temperature=0.3,
        timeout=httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0),
    )
    tts = agents_tts.StreamAdapter(
        tts=EdgeTTS(voice=settings.tts_voice, rate=settings.tts_rate)
    )
    vad = ctx.proc.userdata.get("vad") or silero.VAD.load(force_cpu=True)

    # ---- Tool ---------------------------------------------------------------
    async def _emit_tool_badge(tool_name: str, order_id: str = "") -> None:
        """Emit a system message badge before tool execution."""
        badges = {
            "get_order_details": f"🔍 Looking up order {order_id}...",
            "check_return_eligibility": f"🔄 Checking return eligibility for {order_id}...",
            "cancel_order": f"🚫 Processing cancellation for {order_id}...",
        }
        badge_text = badges.get(tool_name, f"⚙️ Running {tool_name}...")
        await _send_data(ctx.room, {
            "type": "transcript",
            "speaker": "system",
            "text": badge_text,
            "final": True,
        })

    @function_tool(
        description=(
            "Retrieve order details from the database using an order ID like ORD-101. "
            "Call this whenever the customer mentions an order ID or asks about "
            "a specific order's status, delivery, or eligibility for cancel/return."
        )
    )
    async def get_order_details(order_id: str) -> str:
        oid = order_id.strip().upper().replace(" ", "-")
        if oid.startswith("ORD") and "-" not in oid:
            oid = "ORD-" + oid[3:]
        logger.info(f"Tool: get_order_details('{oid}')")
        await _emit_tool_badge("get_order_details", oid)
        try:
            async with AsyncSessionLocal() as db:
                order = await get_order_by_id(db, oid)
            if not order.found:
                return (
                    f"No order found with ID {oid}. Ask the customer to repeat or "
                    "verify the order ID. Do NOT guess any order details."
                )
            return format_order_result_for_llm({
                "found": True,
                "order_id": order.order_id,
                "customer_name": order.customer_name,
                "product": order.product,
                "value": order.value,
                "status": order.status,
                "courier": order.courier,
                "tracking_id": order.tracking_id,
                "expected_delivery": order.expected_delivery,
                "delivered_date": order.delivered_date,
                "order_time": order.order_time,
                "cancellation_eligible": order.cancellation_eligible,
            })
        except Exception as exc:
            logger.error(f"Order lookup error for {oid}: {exc}", exc_info=True)
            return "There was a technical error looking up the order. Apologize and ask them to try again."

    @function_tool(
        description=(
            "Check if an order is eligible for return/refund. Returns eligibility status "
            "and reason. Call this when customer asks about returning a product. "
            "Policy: 7 days from delivery, unopened, unused, original packaging."
        )
    )
    async def check_return_eligibility(order_id: str) -> str:
        oid = order_id.strip().upper().replace(" ", "").replace(".", "").replace("-", "")
        if oid.startswith("ORD"):
            oid = "ORD-" + oid[3:]
        elif oid.isdigit():
            oid = "ORD-" + oid
        logger.info(f"Tool: check_return_eligibility('{oid}')")
        await _emit_tool_badge("check_return_eligibility", oid)
        try:
            async with AsyncSessionLocal() as db:
                order = await get_order_by_id(db, oid)
            if not order.found:
                return f"Order {oid} not found. Cannot check return eligibility."
            
            # Policy logic in code, not LLM
            if order.status != "Delivered":
                return f"Order {oid} is not delivered yet (status: {order.status}). Returns only apply to delivered orders."
            
            # Parse delivered_date to check 7-day window
            # Seed data: "14 days ago" means NOT eligible
            if order.delivered_date:
                days_text = order.delivered_date.lower()
                if "14 days ago" in days_text or "days ago" in days_text:
                    days = int(days_text.split()[0]) if days_text.split()[0].isdigit() else 14
                    if days > 7:
                        return (
                            f"Order {oid} is NOT eligible for return. "
                            f"Delivered {order.delivered_date}, which exceeds our 7-day return window. "
                            "Our policy requires returns within 7 days of delivery for unopened, unused products."
                        )
            
            # If within 7 days and delivered
            return (
                f"Order {oid} is ELIGIBLE for return. "
                f"Delivered {order.delivered_date or 'recently'}. "
                "Customer must ensure product is unopened, unused, in original packaging. "
                "Provide return instructions: email support@auraskincare.com with order ID and photos."
            )
        except Exception as exc:
            logger.error(f"Return eligibility check error for {oid}: {exc}", exc_info=True)
            return "Technical error checking return eligibility. Apologize to customer."

    @function_tool(
        description=(
            "Attempt to cancel an order. Returns success or reason for failure. "
            "Call this when customer explicitly asks to cancel an order. "
            "Policy: Only 'Processing' orders can be cancelled. Shipped/Delivered orders cannot be cancelled."
        )
    )
    async def cancel_order(order_id: str) -> str:
        oid = order_id.strip().upper().replace(" ", "").replace(".", "").replace("-", "")
        if oid.startswith("ORD"):
            oid = "ORD-" + oid[3:]
        elif oid.isdigit():
            oid = "ORD-" + oid
        logger.info(f"Tool: cancel_order('{oid}')")
        await _emit_tool_badge("cancel_order", oid)
        try:
            async with AsyncSessionLocal() as db:
                order = await get_order_by_id(db, oid)
            if not order.found:
                return f"Order {oid} not found. Cannot cancel."
            
            # Policy enforcement in code
            if order.status == "Processing":
                # Persist cancellation to database
                async with AsyncSessionLocal() as db:
                    await cancel_order_in_db(db, oid)
                logger.info(f"Order {oid} successfully cancelled in DB")
                # Notify frontend to refresh order list
                await _send_data(ctx.room, {
                    "type": "order_updated",
                    "order_id": oid,
                    "new_status": "Cancelled",
                })
                return (
                    f"✅ Order {oid} has been successfully cancelled. "
                    f"Refund of ₹{order.value} will be processed within 5-7 business days."
                )
            elif order.status == "Out for Delivery":
                return (
                    f"❌ Order {oid} is already out for delivery and cannot be cancelled through our system. "
                    "Customer can refuse delivery at the doorstep for a full refund."
                )
            elif order.status == "Delivered":
                return (
                    f"❌ Order {oid} was delivered {order.delivered_date}. "
                    "Delivered orders cannot be cancelled. Customer may request a return if eligible."
                )
            else:
                return f"❌ Order {oid} (status: {order.status}) cannot be cancelled at this stage."
        except Exception as exc:
            logger.error(f"Cancel order error for {oid}: {exc}", exc_info=True)
            return "Technical error attempting to cancel. Apologize to customer."

    # Subclass Agent to intercept STT output and TTS input for streaming subtitles.
    class AriaSupportAgent(voice.Agent):
        async def stt_node(self, audio, model_settings):  # type: ignore[override]
            """Filter Whisper hallucinations before they reach the LLM."""
            async for chunk in voice.Agent.default.stt_node(self, audio, model_settings):
                if isinstance(chunk, str):
                    if _is_hallucination(chunk):
                        logger.debug(f"Filtered hallucination: '{chunk}'")
                        return
                    yield chunk
                else:
                    yield chunk

        async def tts_node(self, text, model_settings):  # type: ignore[override]
            """Tap the LLM text stream to emit real-time subtitle chunks to the frontend."""
            import asyncio as _asyncio
            from livekit.agents.utils import aio as _aio

            # We need to fan-out the text stream: one copy to TTS, one to the frontend.
            # Use a queue so TTS never waits on the data channel send.
            subtitle_queue: asyncio.Queue[str | None] = asyncio.Queue()

            async def _drain_subtitles() -> None:
                """Send accumulated word chunks to the frontend as they arrive."""
                accumulated = ""
                full_text = ""
                while True:
                    chunk = await subtitle_queue.get()
                    if chunk is None:
                        break
                    accumulated += chunk
                    full_text += chunk
                    # Emit on sentence boundaries for readable subtitle chunks
                    if any(accumulated.rstrip().endswith(p) for p in (".", "!", "?", ",", ":")):
                        asyncio.ensure_future(_send_data(ctx.room, {
                            "type": "transcript_stream",
                            "speaker": "agent",
                            "text": full_text.strip(),
                            "final": False,
                        }))
                        accumulated = ""

            subtitle_task = asyncio.ensure_future(_drain_subtitles())

            async def _tapped_text():
                """Yield text chunks to TTS while queuing them for subtitles."""
                try:
                    async for chunk in text:
                        subtitle_queue.put_nowait(chunk)
                        yield chunk
                finally:
                    subtitle_queue.put_nowait(None)  # signal end

            try:
                async for frame in voice.Agent.default.tts_node(self, _tapped_text(), model_settings):
                    yield frame
            finally:
                await subtitle_task

    agent = AriaSupportAgent(
        instructions=get_aria_system_prompt(),
        tools=[get_order_details, check_return_eligibility, cancel_order],
    )

    session = voice.AgentSession(
        stt=stt,
        llm=llm,
        tts=tts,
        vad=vad,
        allow_interruptions=True,       # barge-in
        min_endpointing_delay=0.5,      # 0.2 cut people off mid-sentence
        max_endpointing_delay=3.0,
        user_away_timeout=60.0,
    )

    # In-memory transcript for the end-of-call summary
    transcript: list[tuple[str, str]] = []

    # ---- Mic lifecycle management ------------------------------------------
    # Start with mic DISABLED. Enable only after Aria finishes the greeting.
    # Disable again whenever Aria is speaking (any turn), re-enable when done.
    # This prevents:
    #   - Whisper hallucinations on connection noise before the user speaks
    #   - Echo / self-transcription while Aria is talking
    _greeting_done = False
    _user_muted = False  # Track if user explicitly muted from UI

    def _enable_mic() -> None:
        # Only enable if user hasn't explicitly muted
        if _user_muted:
            logger.debug("Mic stays DISABLED (user muted)")
            return
        try:
            session.input.set_audio_enabled(True)
            logger.debug("Mic ENABLED")
        except Exception as exc:
            logger.warning(f"Failed to enable mic: {exc}")

    def _disable_mic() -> None:
        try:
            session.input.set_audio_enabled(False)
            logger.debug("Mic DISABLED")
        except Exception as exc:
            logger.warning(f"Failed to disable mic: {exc}")

    # Disable mic immediately — before the greeting plays
    _disable_mic()

    # ---- Data channel handler for text input --------------------------------
    async def _handle_text_input(payload: dict) -> None:
        """Inject text as a user turn and let the LLM + tools generate a real reply."""
        text = payload.get("text", "").strip()
        if not text:
            return

        logger.info(f"Text input received: '{text}'")

        # Persist user message to DB; agent reply captured via conversation_item_added
        transcript.append(("customer", text))
        if session_id:
            await _save_message(session_id, "customer", text)

        # generate_reply() is synchronous — schedules a reply, returns SpeechHandle.
        try:
            session.generate_reply(user_input=text, allow_interruptions=True)
        except Exception as exc:
            logger.error(f"generate_reply failed: {exc}", exc_info=True)

    @ctx.room.on("data_received")
    def on_data_received(data_packet: rtc.DataPacket):
        """Handle incoming data channel messages from frontend."""
        nonlocal _user_muted
        try:
            payload = json.loads(data_packet.data.decode("utf-8"))
            msg_type = payload.get("type")
            if msg_type == "text_input":
                asyncio.ensure_future(_handle_text_input(payload))
            elif msg_type == "mic_state":
                # User muted/unmuted from the UI — track state
                _user_muted = payload.get("muted", False)
                if _greeting_done:
                    if _user_muted:
                        _disable_mic()
                    else:
                        _enable_mic()
        except Exception as exc:
            logger.warning(f"Failed to parse data packet: {exc}")

    @session.on("agent_state_changed")
    def on_agent_state(ev) -> None:
        nonlocal _greeting_done
        asyncio.ensure_future(
            _send_data(ctx.room, {"type": "voice_state", "state": ev.new_state})
        )
        if ev.new_state == "speaking":
            # Disable mic whenever Aria speaks (greeting or any reply)
            _disable_mic()
        elif ev.new_state in ("listening", "idle"):
            if _greeting_done:
                # Only open mic after the greeting has fully played
                _enable_mic()
            # If greeting not done yet, mic stays disabled until speech_created
            # fires for the greeting turn and then this path enables it

    @session.on("user_input_transcribed")
    def on_user_transcript(ev) -> None:
        if not ev.is_final:
            return
        text = ev.transcript.strip()
        if not text or _is_hallucination(text):
            return
        transcript.append(("customer", text))
        asyncio.ensure_future(_send_data(ctx.room, {
            "type": "transcript", "speaker": "customer", "text": text, "final": True,
        }))
        if session_id:
            asyncio.ensure_future(_save_message(session_id, "customer", text))

    @session.on("conversation_item_added")
    def on_conversation_item(ev) -> None:
        item = ev.item
        if getattr(item, "role", None) != "assistant":
            return
        text = ""
        for part in (getattr(item, "content", None) or []):
            if isinstance(part, str):
                text += part
            elif getattr(part, "text", None):
                text += part.text
        text = text.strip()
        if not text:
            return
        # Persist to DB + in-memory summary ONLY
        transcript.append(("agent", text))
        if session_id:
            asyncio.ensure_future(_save_message(session_id, "agent", text))
        # DON'T send transcript_finalize — streaming already sent the final message

    @session.on("speech_created")
    def on_speech_created(ev) -> None:
        nonlocal _greeting_done
        # Only used for greeting detection now — open mic once greeting finishes.
        if _greeting_done:
            return
        speech_handle = ev.speech_handle

        async def _wait_for_greeting() -> None:
            nonlocal _greeting_done
            try:
                await speech_handle
            except Exception:
                pass
            _greeting_done = True
            _enable_mic()
            logger.info("Greeting complete — mic opened")

        asyncio.ensure_future(_wait_for_greeting())

    # ---- Summary when the room closes --------------------------------------
    async def _on_shutdown() -> None:
        memory_monitor.cancel()
        logger.info(f"[mem] peak_rss={peak_rss:.1f}MB")
        if not session_id:
            logger.warning("No session_id — skipping summary generation")
            return
        logger.info(f"Generating summary for session {session_id} with {len(transcript)} messages")
        try:
            summary = await generate_call_summary(transcript)
            logger.info(f"Summary generated: {json.dumps(summary)}")
            await _persist_summary(session_id, summary)
            logger.info(f"Summary persisted successfully for {session_id}")
        except Exception as exc:
            logger.error(f"Failed in shutdown callback: {exc}", exc_info=True)

    ctx.add_shutdown_callback(_on_shutdown)

    await session.start(agent, room=ctx.room)
    await session.say(
        "Hi! I'm Aria from Aura Skincare. How can I help you today?",
        allow_interruptions=True,
    )


if __name__ == "__main__":
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is required by the agent service")
    if not os.environ.get("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL is required by the agent service")
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            job_executor_type=JobExecutorType.THREAD,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
            ws_url=settings.livekit_url,
            host="0.0.0.0",
            port=int(os.environ.get("PORT", "8090")),
            load_threshold=0.7,
            num_idle_processes=0,
        )
    )
