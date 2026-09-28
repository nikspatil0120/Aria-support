export type VoiceSessionState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected"
  | "error";

export type MicrophoneState = "ready" | "active" | "permission-required" | "unavailable" | "muted";

export interface TranscriptMessage {
  id: string;
  speaker: "customer" | "agent" | "system";
  text: string;
  timestamp: string;
}

export interface VoiceSession {
  state: VoiceSessionState;
  isMuted: boolean;
  isConnected: boolean;
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  mute: () => void;
  unmute: () => void;
  transcript: TranscriptMessage[];
  error?: string;
}

export interface Order {
  id: string;
  customer: string;
  product: string;
  price: string;
  status: "Out for Delivery" | "Delivered" | "Processing";
  carrier?: string;
  trackingId?: string;
  timing: string;
  note?: string;
}

export interface CallSummary {
  customer_intent: string;
  order_id?: string;
  resolution_status: string;
  call_summary: string;
  policy_used?: string;
  duration_seconds?: number;
}