import type { TranscriptMessage } from "@/types/support";

export const demonstrationTranscript: TranscriptMessage[] = [
  {
    id: "system-ready",
    speaker: "system",
    text: "Aria demonstration started. No microphone audio is being sent.",
    timestamp: "Now",
  },
  {
    id: "agent-welcome",
    speaker: "agent",
    text: "Hi, I’m Aria. I can help with orders, delivery, returns, and cancellations.",
    timestamp: "Now",
  },
  {
    id: "customer-sample",
    speaker: "customer",
    text: "I’d like to check an order status.",
    timestamp: "Now",
  },
  {
    id: "agent-sample",
    speaker: "agent",
    text: "In the connected experience, I’ll securely check the order details you share.",
    timestamp: "Now",
  },
];
