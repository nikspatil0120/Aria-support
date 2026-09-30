import { MessageCircle, Sparkles } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { TextInputBar } from "@/components/support/TextInputBar";
import type { TranscriptMessage } from "@/types/support";

interface ConversationPanelProps {
  transcript: TranscriptMessage[];
  isConnected?: boolean;
  onSendMessage?: (text: string) => Promise<void>;
}

export function ConversationPanel({
  transcript,
  isConnected = false,
  onSendMessage,
}: ConversationPanelProps) {
  return (
    <section
      className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-luxury"
      style={{ height: 580 }}
      aria-labelledby="conversation-title"
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between px-6 py-5"
        style={{
          background: "linear-gradient(135deg, var(--card) 0%, color-mix(in oklab, var(--primary) 4%, var(--card)) 100%)",
          borderBottom: "1px solid color-mix(in oklab, var(--border) 60%, transparent)",
        }}
      >
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
            Live transcript
          </p>
          <h2 id="conversation-title" className="mt-1 font-display text-2xl">
            Conversation
          </h2>
        </div>

        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-primary ring-1 ring-primary/20"
          style={{ background: "color-mix(in oklab, var(--primary) 8%, transparent)" }}
        >
          <Sparkles className="size-3" />
          Aria AI
        </div>
      </div>

      {/* Messages + input */}
      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="gap-5 p-5">
            {transcript.length === 0 ? (
              <ConversationEmptyState
                icon={
                  <div
                    className="grid size-14 place-items-center rounded-2xl text-primary ring-1 ring-primary/15"
                    style={{ background: "color-mix(in oklab, var(--primary) 8%, var(--secondary))" }}
                  >
                    <MessageCircle className="size-7 stroke-[1.3]" />
                  </div>
                }
                title="Ready when you are"
                description="Your live conversation with Aria appears here in real time."
              />
            ) : (
              transcript.map((item) => <TranscriptItem key={item.id} item={item} />)
            )}
          </ConversationContent>
          <ConversationScrollButton aria-label="Scroll to latest message" />
        </Conversation>

        {isConnected && onSendMessage && (
          <TextInputBar onSendMessage={onSendMessage} placeholder="Message Aria…" />
        )}
      </div>
    </section>
  );
}

function TranscriptItem({ item }: { item: TranscriptMessage }) {
  /* ── System / tool badge ── */
  if (item.speaker === "system") {
    return (
      <div className="flex items-center gap-3 py-0.5">
        <div className="h-px flex-1" style={{ background: "color-mix(in oklab, var(--border) 50%, transparent)" }} />
        <span
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[10px] font-semibold text-muted-foreground ring-1"
          style={{
            background: "color-mix(in oklab, var(--muted) 70%, transparent)",
            ringColor: "color-mix(in oklab, var(--border) 60%, transparent)",
          }}
        >
          <Sparkles className="size-2.5 text-primary/60" />
          {item.text}
        </span>
        <div className="h-px flex-1" style={{ background: "color-mix(in oklab, var(--border) 50%, transparent)" }} />
      </div>
    );
  }

  const isUser = item.speaker === "customer";
  const isStreaming = item.id === "aria-stream-current";
  const timeLabel = new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Message from={isUser ? "user" : "assistant"}>
      {/* Sender row */}
      <div className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
        {!isUser && (
          <div
            className="grid size-5 shrink-0 place-items-center rounded-full ring-1 ring-primary/20"
            style={{ background: "color-mix(in oklab, var(--primary) 14%, var(--secondary))" }}
          >
            <Sparkles className="size-2.5 text-primary" />
          </div>
        )}
        <span className="text-[11px] font-semibold text-muted-foreground">
          {isUser ? "You" : "Aria"}
        </span>
        {isStreaming ? (
          <span className="text-[10px] font-medium text-primary/80 animate-pulse">speaking…</span>
        ) : (
          <span className="text-[10px] text-muted-foreground/50">{timeLabel}</span>
        )}
      </div>

      {/* Bubble */}
      <MessageContent
        className={isUser
          ? "rounded-2xl rounded-tr-sm bg-primary text-primary-foreground shadow-sm"
          : "rounded-2xl rounded-tl-sm border border-border/40 bg-card shadow-soft max-w-prose"
        }
      >
        <MessageResponse>{item.text}</MessageResponse>
      </MessageContent>
    </Message>
  );
}
