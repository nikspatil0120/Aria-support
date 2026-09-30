"""edge-tts (free Microsoft neural voices, no API key) as a livekit-agents TTS.

edge-tts streams MP3 chunks. We push them to AudioEmitter as audio/mpeg and
LiveKit decodes them, so the first audio arrives fast (no waiting for full file).
Wrap in tts.StreamAdapter so long replies are synthesized sentence by sentence.
"""
from __future__ import annotations

import logging
import uuid

import edge_tts
from livekit.agents import APIConnectOptions
from livekit.agents import tts as agents_tts

logger = logging.getLogger(__name__)

EDGE_SAMPLE_RATE = 24000  # edge-tts MP3 output is 24 kHz mono


class _EdgeChunkedStream(agents_tts.ChunkedStream):
    def __init__(self, *, tts: "EdgeTTS", input_text: str, conn_options: APIConnectOptions):
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._edge = tts

    async def _run(self, output_emitter: agents_tts.AudioEmitter) -> None:
        output_emitter.initialize(
            request_id=str(uuid.uuid4()),
            sample_rate=EDGE_SAMPLE_RATE,
            num_channels=1,
            mime_type="audio/mpeg",
            stream=True,
        )
        # This livekit-agents version requires an explicit segment
        output_emitter.start_segment(segment_id=str(uuid.uuid4()))
        communicate = edge_tts.Communicate(
            self._input_text,
            voice=self._edge.voice,
            rate=self._edge.rate,
        )
        try:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    output_emitter.push(chunk["data"])
            output_emitter.flush()
        except Exception as exc:
            logger.error(f"edge-tts error: {exc}", exc_info=True)
        finally:
            output_emitter.end_segment()


class EdgeTTS(agents_tts.TTS):
    def __init__(self, voice: str = "en-IN-NeerjaNeural", rate: str = "+0%") -> None:
        super().__init__(
            capabilities=agents_tts.TTSCapabilities(streaming=False),
            sample_rate=EDGE_SAMPLE_RATE,
            num_channels=1,
        )
        self.voice = voice
        self.rate = rate

    def synthesize(self, text: str, *, conn_options: APIConnectOptions | None = None):
        return _EdgeChunkedStream(
            tts=self,
            input_text=text,
            conn_options=conn_options or APIConnectOptions(),
        )
