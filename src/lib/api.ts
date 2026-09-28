import { mockOrders } from "@/data/mockOrders";
import { demonstrationSummary } from "@/data/mockSummary";
import type { CallSummary, Order } from "@/types/support";

export async function getOrders(): Promise<Order[]> {
  return [...mockOrders];
}

export async function getOrderDetails(orderId: string): Promise<Order | undefined> {
  return mockOrders.find((order) => order.id === orderId);
}

export async function getCallSummary(_callId: string): Promise<CallSummary> {
  return { ...demonstrationSummary };
}
