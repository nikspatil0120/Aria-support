import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

interface TextInputBarProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function TextInputBar({ onSendMessage, disabled = false, placeholder = "Message Aria…" }: TextInputBarProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || sending) return;
    setSending(true);
    try { await onSendMessage(message.trim()); setMessage(""); }
    catch { /* silent */ }
    finally { setSending(false); }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(e as unknown as FormEvent); }
  };

  const canSend = message.trim().length > 0 && !disabled && !sending;

  return (
    <div
      className="shrink-0 px-4 py-3.5"
      style={{
        borderTop: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
        background: "linear-gradient(to bottom, color-mix(in oklab, var(--card) 80%, transparent), var(--card))",
        backdropFilter: "blur(12px)",
      }}
    >
      <form onSubmit={submit} className="flex items-center gap-2.5">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          disabled={disabled || sending}
          className="h-10 flex-1 rounded-xl border border-border/50 bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 backdrop-blur transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Type your message"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all duration-200 hover:scale-[1.06] hover:shadow-[0_4px_16px_color-mix(in_oklab,var(--primary)_35%,transparent)] active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Send"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
      <p className="mt-1.5 text-center text-[9px] tracking-wide text-muted-foreground/40">
        Aria responds with voice &amp; text
      </p>
    </div>
  );
}
