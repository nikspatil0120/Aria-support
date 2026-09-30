import { CheckCircle2, Clock3, FileText, Package, Phone, Sparkles } from "lucide-react";
import type { CallSummary, TranscriptMessage } from "@/types/support";

export function CallSummaryView({
  summary,
  transcript,
  onNewCall,
}: {
  summary: CallSummary;
  transcript: TranscriptMessage[];
  onNewCall: () => void;
}) {
  const duration = summary.duration_seconds
    ? `${Math.floor(summary.duration_seconds / 60)}m ${summary.duration_seconds % 60}s`
    : "—";

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-luxury animate-scale-in"
      aria-labelledby="summary-title"
    >
      {/* Hero header */}
      <div
        className="relative overflow-hidden px-7 py-8 sm:px-10"
        style={{
          background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 6%, var(--card)) 0%, color-mix(in oklab, var(--primary) 2%, var(--card)) 100%)",
          borderBottom: "1px solid color-mix(in oklab, var(--border) 55%, transparent)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -right-16 -top-16 size-48 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ background: "color-mix(in oklab, var(--primary) 15%, transparent)" }}
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1">
              <CheckCircle2 className="size-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Session complete
              </span>
            </div>
            <h2 id="summary-title" className="font-display text-4xl sm:text-5xl text-foreground">
              Call Summary
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Here's what Aria resolved for you today
            </p>
          </div>

          <button
            onClick={onNewCall}
            className="flex items-center gap-2.5 self-start rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_20px_color-mix(in_oklab,var(--primary)_28%,transparent)] transition-all hover:scale-[1.03] hover:shadow-[0_6px_28px_color-mix(in_oklab,var(--primary)_35%,transparent)] active:scale-[0.97] sm:self-auto"
          >
            <Phone className="size-3.5" />
            New call
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: FileText,    label: "Intent",     value: summary.customer_intent },
          { icon: Package,     label: "Order",       value: summary.order_id ?? "Not mentioned" },
          { icon: CheckCircle2,label: "Resolution",  value: summary.resolution_status },
          { icon: Clock3,      label: "Duration",    value: duration },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border/40 p-4 transition-all hover:border-primary/20 hover:shadow-soft"
            style={{ background: "color-mix(in oklab, var(--muted) 50%, var(--card))" }}
          >
            <div
              className="mb-3 grid size-9 place-items-center rounded-lg text-primary ring-1 ring-primary/15"
              style={{ background: "color-mix(in oklab, var(--primary) 9%, var(--secondary))" }}
            >
              <Icon className="size-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground leading-snug">{value}</p>
          </div>
        ))}
      </div>

      {/* Summary text */}
      <div className="mx-6 mb-6 rounded-xl border border-border/30 p-5"
        style={{ background: "color-mix(in oklab, var(--primary) 3%, var(--muted))" }}
      >
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Summary
          </p>
        </div>
        <p className="text-sm leading-7 text-foreground">{summary.call_summary}</p>
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="border-t border-border/40 px-6 py-6">
          <h3 className="mb-4 font-display text-2xl">Transcript</h3>
          <div className="flex flex-col gap-1">
            {transcript
              .filter((m) => m.speaker !== "system")
              .map((msg) => {
                const isUser = msg.speaker === "customer";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 py-2.5 border-b border-border/25 last:border-0 ${isUser ? "" : ""}`}
                  >
                    <span
                      className={`w-10 shrink-0 text-[10px] font-bold uppercase tracking-widest pt-0.5 ${
                        isUser ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {isUser ? "You" : "Aria"}
                    </span>
                    <p className="text-sm leading-6 text-foreground">{msg.text}</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </section>
  );
}
