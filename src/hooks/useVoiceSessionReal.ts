/**
 * Real LiveKit voice session hook.
 *
 * State transitions come from two sources:
 *  1. LiveKit connection events (idle / connecting / listening / disconnected)
 *  2. Agent data-channel messages (listening / thinking / speaking) — these
 *     override the connection-level state while a call is active so the UI
 *     accurately reflects what Aria is doing.
 *
 * Transcript lines are pushed via the data channel and appended locally —
 * no polling required.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Room } from "livekit-client";
import {
  livekitService,
  type AgentDataMessage,
  type ConnectionStatus,
} from "@/lib/livekit-service";
import { createSession, getLiveKitToken, getSessionTranscript } from "@/lib/api";
import type { TranscriptMessage, VoiceSession, VoiceSessionState } from "@/types/support";

export function useVoiceSessionReal(): VoiceSession {
  const [state, setState] = useState<VoiceSessionState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [orderRefreshTick, setOrderRefreshTick] = useState(0);
  const [ariaAudioReady, setAriaAudioReady] = useState(false);

  const sessionIdRef = useRef<string | undefined>(undefined);
  const roomRef = useRef<Room | null>(null);
  // Track connection-level state separately so we can gate agent state overrides
  const connectionStateRef = useRef<ConnectionStatus>("disconnected");

  // -----------------------------------------------------------------------
  // Cleanup on unmount
  // -----------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        void livekitService.disconnect();
      }
    };
  }, []);

  // -----------------------------------------------------------------------
  // LiveKit service callbacks — registered once, stable refs via useRef
  // -----------------------------------------------------------------------
  useEffect(() => {
    // Connection-level state (idle / connecting / listening / disconnected)
    livekitService.onStateChange((status: ConnectionStatus) => {
      connectionStateRef.current = status;

      setState((prev) => {
        switch (status) {
          case "connecting":
          case "reconnecting":
            return "connecting";
          case "connected":
            // Only move to listening if not already in a richer agent state
            return prev === "connecting" ? "listening" : prev;
          case "disconnected":
          case "disconnecting":
            return prev === "idle" ? "idle" : "disconnected";
          default:
            return "idle";
        }
      });
    });

    livekitService.onAgentConnected(() => {
      console.log("Aria agent connected to room");
    });

    livekitService.onAudioTrack(() => {
      console.log("Receiving audio from Aria");
      setAriaAudioReady(true);
    });

    livekitService.onOrderUpdated((orderId, newStatus) => {
      console.log(`Order ${orderId} updated to ${newStatus} — refreshing order list`);
      setOrderRefreshTick((t) => t + 1);
    });

    // Data channel — agent pushes voice_state, transcript, and transcript_stream messages
    livekitService.onData((msg: AgentDataMessage) => {
      if (msg.type === "voice_state") {
        if (connectionStateRef.current === "connected") {
          const agentState = msg.state as VoiceSessionState;
          setState(agentState === "idle" ? "listening" : agentState);
        }
        // When agent finishes speaking, finalize any orphaned stream item
        if (msg.state === "listening" || msg.state === "idle") {
          setTranscript((prev) => {
            const streamItem = prev.find((m) => m.id === "aria-stream-current");
            if (!streamItem) return prev;
            return prev.map((m) =>
              m.id === "aria-stream-current"
                ? {
                    ...m,
                    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    timestamp: new Date().toISOString(),
                  }
                : m,
            );
          });
        }
      } else if (msg.type === "transcript" && msg.final) {
        const line: TranscriptMessage = {
          id: `${msg.speaker}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          speaker: msg.speaker === "agent" ? "agent" : msg.speaker === "system" ? "system" : "customer",
          text: msg.text,
          timestamp: new Date().toISOString(),
        };
        setTranscript((prev) => [...prev, line]);
      } else if (msg.type === "transcript_stream") {
        const streamId = "aria-stream-current";
        // Growing subtitle — update in-place
        setTranscript((prev) => {
          const existing = prev.find((m) => m.id === streamId);
          if (existing) {
            return prev.map((m) =>
              m.id === streamId ? { ...m, text: msg.text } : m,
            );
          }
          return [
            ...prev,
            {
              id: streamId,
              speaker: "agent" as const,
              text: msg.text,
              timestamp: new Date().toISOString(),
            },
          ];
        });
      } else if (msg.type === "transcript_finalize") {
        // Finalize the streaming message - make it permanent
        const streamId = "aria-stream-current";
        const finalItem: TranscriptMessage = {
          id: `agent-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          speaker: "agent",
          text: msg.text,
          timestamp: new Date().toISOString(),
        };
        setTranscript((prev) => {
          // Only replace if stream exists, otherwise skip (already finalized)
          const hasStream = prev.some((m) => m.id === streamId);
          if (hasStream) {
            return prev.map((m) => (m.id === streamId ? finalItem : m));
          }
          return prev; // No stream = already finalized, skip duplicate
        });
      }
    });

    // No deps — register once on mount, the service holds the callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // startCall
  // -----------------------------------------------------------------------
  const startCall = useCallback(async () => {
    try {
      setState("connecting");
      setError(undefined);
      setTranscript([]);
      setAriaAudioReady(false);
      sessionIdRef.current = undefined;

      console.log("Creating session…");
      const session = await createSession();
      sessionIdRef.current = session.id;
      console.log("Session created:", session.id);

      console.log("Getting LiveKit token…");
      const { token, url } = await getLiveKitToken(session.id);
      console.log("Token received");

      console.log("Connecting to LiveKit room…");
      const room = await livekitService.connect({
        serverUrl: url,
        token,
        roomName: session.livekit_room_name,
      });

      roomRef.current = room;
      console.log("Connected to room successfully");
      // State moves to 'listening' via the onStateChange callback above
    } catch (err) {
      console.error("Failed to start call:", err);
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, []);

  // -----------------------------------------------------------------------
  // endCall
  // -----------------------------------------------------------------------
  const endCall = useCallback(async () => {
    try {
      // Fetch the authoritative final transcript from the DB before tearing down
      if (sessionIdRef.current) {
        try {
          const messages = await getSessionTranscript(sessionIdRef.current);
          if (messages.length > 0) setTranscript(messages);
        } catch (err) {
          console.error("Failed to get final transcript:", err);
        }
      }

      await livekitService.disconnect();
      roomRef.current = null;
      setState("disconnected");
    } catch (err) {
      console.error("Failed to end call:", err);
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }, []);

  // -----------------------------------------------------------------------
  // Mute / unmute
  // -----------------------------------------------------------------------
  const mute = useCallback(async () => {
    try {
      await livekitService.mute();
      await livekitService.sendMicState(true);
      setIsMuted(true);
    } catch (err) {
      console.error("Failed to mute:", err);
    }
  }, []);

  const unmute = useCallback(async () => {
    try {
      await livekitService.unmute();
      await livekitService.sendMicState(false);
      setIsMuted(false);
    } catch (err) {
      console.error("Failed to unmute:", err);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Send text message
  // -----------------------------------------------------------------------
  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    try {
      await livekitService.sendTextMessage(text);
      
      // Add the user's text message to transcript immediately for responsive UI
      const line: TranscriptMessage = {
        id: `customer-text-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        speaker: "customer",
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };
      setTranscript((prev) => [...prev, line]);
    } catch (err) {
      console.error("Failed to send text message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  }, []);

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------
  return {
    state,
    isMuted,
    isConnected: livekitService.isConnected(),
    sessionId: sessionIdRef.current,
    startCall,
    endCall,
    mute,
    unmute,
    sendTextMessage,
    transcript,
    error,
    orderRefreshTick,
    ariaAudioReady,
  };
}
