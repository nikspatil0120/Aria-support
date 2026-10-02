import { mockOrders } from "@/data/mockOrders";
import { demonstrationSummary } from "@/data/mockSummary";
import type { CallSummary, Order, TranscriptMessage } from "@/types/support";
import { config } from "./config";

/**
 * API client for backend communication.
 * 
 * This abstraction allows swapping between mock data and real backend
 * without changing UI components.
 */

const API_BASE = config.apiUrl;

// Session Management

export interface SessionResponse {
  id: string;
  livekit_room_name: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  room_name: string;
}

export async function createSession(): Promise<SessionResponse> {
  if (!config.enableRealVoice) {
    // Mock response for development
    return {
      id: "mock_session_123",
      livekit_room_name: "mock_room",
      status: "created",
      started_at: null,
      ended_at: null,
      duration_seconds: null,
      created_at: new Date().toISOString(),
    };
  }

  const response = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return response.json();
}

export async function getLiveKitToken(
  sessionId: string,
  participantName: string = "customer"
): Promise<LiveKitTokenResponse> {
  if (!config.enableRealVoice) {
    throw new Error("Real voice is disabled in development mode");
  }

  const response = await fetch(`${API_BASE}/api/livekit/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      participant_name: participantName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get LiveKit token: ${response.statusText}`);
  }

  return response.json();
}

export async function getSession(sessionId: string): Promise<SessionResponse> {
  if (!config.enableRealVoice) {
    return {
      id: sessionId,
      livekit_room_name: "mock_room",
      status: "active",
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_seconds: null,
      created_at: new Date().toISOString(),
    };
  }

  const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }

  return response.json();
}

export async function getSessionTranscript(
  sessionId: string
): Promise<TranscriptMessage[]> {
  if (!config.enableRealVoice) {
    return [];
  }

  const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/transcript`);

  if (!response.ok) {
    throw new Error(`Failed to get transcript: ${response.statusText}`);
  }

  const data = await response.json();
  return data.messages;
}

export async function getSessionSummary(sessionId: string): Promise<CallSummary> {
  if (!config.enableRealVoice) {
    return { ...demonstrationSummary };
  }

  const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/summary`);

  if (!response.ok) {
    throw new Error(`Failed to get summary: ${response.statusText}`);
  }

  return response.json();
}

// Order Management

export async function getOrders(): Promise<Order[]> {
  if (!config.enableRealVoice) {
    return [...mockOrders];
  }

  const response = await fetch(`${API_BASE}/api/orders`);

  if (!response.ok) {
    throw new Error(`Failed to get orders: ${response.statusText}`);
  }

  const data = await response.json();
  return data.map((order: any) => ({
    id: order.order_id,
    customer: order.customer_name,
    product: order.product,
    price: `₹${order.value}`,
    status: order.status,
    carrier: order.courier,
    trackingId: order.tracking_id,
    timing: order.expected_delivery || order.delivered_date || order.order_time || "",
    cancellationEligible: order.cancellation_eligible,
    expectedDelivery: order.expected_delivery,
    deliveredDate: order.delivered_date,
    orderTime: order.order_time,
    note: order.cancellation_eligible ? "Eligible for cancellation" : undefined,
  }));
}

export async function resetDemoOrders(): Promise<void> {
  if (!config.enableRealVoice) return;

  const response = await fetch(`${API_BASE}/api/orders/reset`, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Failed to reset orders: ${response.statusText}`);
  }
}

export async function getOrderDetails(orderId: string): Promise<Order | undefined> {
  if (!config.enableRealVoice) {
    return mockOrders.find((order) => order.id === orderId);
  }

  const response = await fetch(`${API_BASE}/api/orders/${orderId}`);

  if (!response.ok) {
    throw new Error(`Failed to get order: ${response.statusText}`);
  }

  const order = await response.json();
  
  if (!order.found) {
    return undefined;
  }

  return {
    id: order.order_id,
    customer: order.customer_name,
    product: order.product,
    price: `₹${order.value}`,
    status: order.status,
    carrier: order.courier,
    trackingId: order.tracking_id,
    timing: order.expected_delivery || order.delivered_date || order.order_time || "",
    cancellationEligible: order.cancellation_eligible,
    expectedDelivery: order.expected_delivery,
    deliveredDate: order.delivered_date,
    orderTime: order.order_time,
    note: order.cancellation_eligible ? "Eligible for cancellation" : undefined,
  };
}

export async function getCallSummary(callId: string): Promise<CallSummary> {
  if (!config.enableRealVoice) {
    return { ...demonstrationSummary };
  }

  return getSessionSummary(callId);
}

// Health Check & Cold Start

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function waitForBackendWakeup(maxAttempts: number = 20): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isHealthy = await checkHealth();
    if (isHealthy) {
      console.log(`Backend is awake after ${attempt} attempt(s)`);
      return true;
    }
    console.log(`Backend wake-up attempt ${attempt}/${maxAttempts}...`);
    const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}
