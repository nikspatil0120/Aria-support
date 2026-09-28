import { MessageCircle } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import type { TranscriptMessage } from "@/types/support";

export function ConversationPanel({ transcript }: { transcript: TranscriptMessage[] }) {
  return (
    <section
      className="flex min-h-[390px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft"
      aria-labelledby="conversation-title"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Live transcript</p>
          <h2 id="conversation-title" className="mt-1 font-display text-2xl text-foreground">
            Conversation
          </h2>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Voice support
        </span>
      </div>
      <Conversation className="h-[330px]">
        <ConversationContent className="gap-5 p-5">
          {transcript.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageCircle className="size-8 stroke-[1.4]" />}
              title="Ready when you are"
              description="Your conversation with Aria will appear here."
            />
          ) : (
            transcript.map((item) => <TranscriptItem key={item.id} item={item} />)
          )}
        </ConversationContent>
        <ConversationScrollButton aria-label="Scroll to latest message" />
      </Conversation>
    </section>
  );
}

function TranscriptItem({ item }: { item: TranscriptMessage }) {
  if (item.speaker === "system") {
    return (
      <p className="mx-auto max-w-sm rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        {item.text}
      </p>
    );
  }

  const from = item.speaker === "customer" ? "user" : "assistant";
  return (
    <Message from={from}>
      <div className={from === "user" ? "text-right" : "text-left"}>
        <span className="text-xs font-semibold text-muted-foreground">
          {item.speaker === "customer" ? "You" : "Aria"}
        </span>
        <span className="ml-2 text-xs text-muted-foreground">{item.timestamp}</span>
      </div>
      <MessageContent
        className={from === "user" ? "bg-primary text-primary-foreground" : "max-w-prose"}
      >
        <MessageResponse>{item.text}</MessageResponse>
      </MessageContent>
    </Message>
  );
}
