import { useCallback, useEffect, useRef, useState } from "react";
import { demonstrationTranscript } from "@/data/mockConversation";
import type { TranscriptMessage, VoiceSession, VoiceSessionState } from "@/types/support";
import { config } from "@/lib/config";
import { useVoiceSessionReal } from "./useVoiceSessionReal";

/**
 * Voice session hook with mock/real mode switching.
 * 
 * When VITE_ENABLE_REAL_VOICE=true, uses LiveKit.
 * Otherwise, uses mock demonstration mode.
 */

const sequence: Array<{ state: VoiceSessionState; delay: number; messages: number }> = [
  { state: "listening", delay: 1800, messages: 2 },
  { state: "thinking", delay: 1600, messages: 3 },
  { state: "speaking", delay: 2400, messages: 4 },
  { state: "listening", delay: 0, messages: 4 },
];

function useVoiceSessionMock(): VoiceSession {
  const [state, setState] = useState<VoiceSessionState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearSequence = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearSequence, [clearSequence]);

  const startCall = useCallback(async () => {
    clearSequence();
    setState("connecting");
    setIsMuted(false);
    setTranscript([]);
    let elapsed = 0;
    sequence.forEach((step) => {
      elapsed += step.delay;
      timers.current.push(
        setTimeout(() => {
          setState(step.state);
          setTranscript(demonstrationTranscript.slice(0, step.messages));
        }, elapsed),
      );
    });
  }, [clearSequence]);

  const endCall = useCallback(async () => {
    clearSequence();
    setTranscript(demonstrationTranscript);
    setState("disconnected");
  }, [clearSequence]);

  return {
    state,
    isMuted,
    isConnected: ["listening", "thinking", "speaking"].includes(state),
    startCall,
    endCall,
    mute: () => setIsMuted(true),
    unmute: () => setIsMuted(false),
    transcript,
  };
}

export function useVoiceSession(): VoiceSession {
  // Switch between mock and real implementation based on config
  const mockSession = useVoiceSessionMock();
  const realSession = useVoiceSessionReal();

  return config.enableRealVoice ? realSession : mockSession;
}
