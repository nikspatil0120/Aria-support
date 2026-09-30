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
  sessionId?: string | undefined;
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  mute: () => void;
  unmute: () => void;
  sendTextMessage?: (text: string) => Promise<void>;
  transcript: TranscriptMessage[];
  error?: string | undefined;
  orderRefreshTick?: number;
  ariaAudioReady?: boolean;
}

export interface Order {
  id: string;
  customer: string;
  product: string;
  price: string;
  status: "Out for Delivery" | "Delivered" | "Processing";
  carrier?: string | undefined;
  trackingId?: string | undefined;
  timing: string;
  note?: string | undefined;
  cancellationEligible?: boolean | undefined;
  expectedDelivery?: string | undefined;
  orderTime?: string | undefined;
  deliveredDate?: string | undefined;
}

export interface CallSummary {
  customer_intent: string;
  order_id?: string;
  resolution_status: string;
  call_summary: string;
  policy_used?: string;
  duration_seconds?: number;
}
