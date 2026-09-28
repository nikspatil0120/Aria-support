import { CheckCircle2, Clock3, FileText, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      className="rounded-lg border border-border bg-card p-5 shadow-soft sm:p-7"
      aria-labelledby="summary-title"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Conversation complete
          </p>
          <h2 id="summary-title" className="mt-1 font-display text-4xl text-foreground">
            Call summary
          </h2>
        </div>
        <Button variant="outline" onClick={onNewCall}>
          Start a new call
        </Button>
      </div>
      <div className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryDetail icon={FileText} label="Customer intent" value={summary.customer_intent} />
        <SummaryDetail icon={Package} label="Order ID" value={summary.order_id ?? "Not provided"} />
        <SummaryDetail icon={CheckCircle2} label="Resolution" value={summary.resolution_status} />
        <SummaryDetail icon={Clock3} label="Duration" value={duration} />
      </div>
      <div className="rounded-md bg-muted p-5">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Summary</p>
        <p className="mt-2 leading-7 text-foreground">{summary.call_summary}</p>
      </div>
      <div className="mt-6">
        <h3 className="font-display text-2xl">Conversation transcript</h3>
        <div className="mt-3 grid gap-3">
          {transcript.map((message) => (
            <div key={message.id} className="flex gap-3 border-b border-border py-3 last:border-0">
              <span className="w-14 shrink-0 text-xs font-semibold uppercase text-muted-foreground">
                {message.speaker === "customer"
                  ? "You"
                  : message.speaker === "agent"
                    ? "Aria"
                    : "Note"}
              </span>
              <p className="text-sm leading-6 text-foreground">{message.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border p-4">
      <Icon className="size-5 text-primary" />
      <p className="mt-4 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}
