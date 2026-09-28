import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Headphones,
  Mic,
  MicOff,
  Phone,
  ShieldCheck,
  Truck,
  Undo2,
  WalletCards,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AriaAvatar } from "@/components/support/AriaAvatar";
import { CallSummaryView } from "@/components/support/CallSummaryView";
import { ConversationPanel } from "@/components/support/ConversationPanel";
import { OrderPanel } from "@/components/support/OrderPanel";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { getCallSummary } from "@/lib/api";
import type { CallSummary, VoiceSessionState } from "@/types/support";
import botanicalImage from "@/assets/aura-botanical.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aura Skincare | AI Customer Support" },
      {
        name: "description",
        content:
          "Get instant help with Aura Skincare orders, shipping, returns and more with Aria.",
      },
      { property: "og:title", content: "Aura Skincare | AI Customer Support" },
      {
        property: "og:description",
        content:
          "Get instant help with Aura Skincare orders, shipping, returns and more with Aria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const stateContent: Record<VoiceSessionState, { label: string; description: string }> = {
  idle: { label: "Ready when you are", description: "Start a conversation with Aria" },
  connecting: { label: "Connecting", description: "Preparing your conversation" },
  listening: { label: "Listening", description: "Aria is listening" },
  thinking: { label: "Thinking", description: "Aria is checking that" },
  speaking: { label: "Speaking", description: "Aria is responding" },
  disconnected: { label: "Call ended", description: "Your call summary is ready" },
  error: { label: "Connection issue", description: "Please try starting again" },
};

const helpItems = [
  { icon: Truck, title: "Track an order", text: "Get the latest status of your order." },
  { icon: Undo2, title: "Returns & refunds", text: "Learn about our return and refund policy." },
  { icon: PackageIcon, title: "Shipping", text: "Check delivery times and shipping charges." },
  { icon: XCircle, title: "Cancellation", text: "Find out whether your order can be cancelled." },
  { icon: WalletCards, title: "COD", text: "Learn about Cash on Delivery availability." },
];

function PackageIcon(props: React.ComponentProps<typeof Truck>) {
  return <ShieldCheck {...props} />;
}

function Index() {
  const voice = useVoiceSession();
  const [summary, setSummary] = useState<CallSummary>();
  const current = stateContent[voice.state];
  const micLabel = voice.isMuted
    ? "Microphone muted"
    : voice.isConnected
      ? "Microphone active"
      : "Microphone ready";

  useEffect(() => {
    if (voice.state === "disconnected") void getCallSummary("current").then(setSummary);
  }, [voice.state]);

  const start = () => {
    setSummary(undefined);
    void voice.startCall();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <a
            href="#home"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Aura Skincare home"
          >
            <span className="grid size-9 place-items-center rounded-full border border-primary/30 text-primary">
              <span className="font-display text-xl">A</span>
            </span>
            <span>
              <strong className="block font-display text-lg leading-none">AURA</strong>
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                Skincare
              </span>
            </span>
          </a>
          <nav
            className="hidden items-center gap-8 text-sm font-medium sm:flex"
            aria-label="Main navigation"
          >
            <a href="#home" className="text-foreground hover:text-primary">
              Home
            </a>
            <a href="#support" className="text-muted-foreground hover:text-primary">
              Support
            </a>
          </nav>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="size-2 rounded-full bg-online" />
            AI Support
          </div>
        </div>
      </header>

      <main id="home" className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <div className="mb-5 flex items-center justify-center gap-2 rounded-md border border-border bg-muted/70 px-4 py-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" /> Voice preview — this
          demonstration does not access your microphone.
        </div>

        {summary && voice.state === "disconnected" ? (
          <CallSummaryView summary={summary} transcript={voice.transcript} onNewCall={start} />
        ) : (
          <div
            id="support"
            className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)]"
          >
            <section
              className="relative min-h-[590px] overflow-hidden rounded-lg border border-border bg-card shadow-card"
              aria-labelledby="aria-title"
            >
              <img
                src={botanicalImage}
                width={1536}
                height={1024}
                alt="Aura botanical serum with fresh green leaves"
                className="absolute inset-0 size-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-hero-overlay" />
              <div className="relative flex min-h-[590px] flex-col items-center justify-between p-6 text-center sm:p-9">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">
                    Personal voice support
                  </p>
                  <h1
                    id="aria-title"
                    className="mt-2 font-display text-5xl text-foreground sm:text-6xl"
                  >
                    ARIA
                  </h1>
                  <p className="mt-1 font-display text-xl text-foreground">
                    Your Aura Skincare Assistant
                  </p>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    Talk to Aria for help with orders, shipping, returns and more.
                  </p>
                </div>
                <AriaAvatar state={voice.state} />
                <div className="w-full max-w-md">
                  <div aria-live="polite" aria-atomic="true">
                    <div className="flex items-center justify-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      <p className="font-semibold">{current.label}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    {voice.state === "idle" ||
                    voice.state === "disconnected" ||
                    voice.state === "error" ? (
                      <Button
                        size="lg"
                        className="h-12 min-w-40 rounded-full px-7"
                        onClick={start}
                        aria-label={
                          voice.state === "error" ? "Retry call with Aria" : "Start call with Aria"
                        }
                      >
                        <Phone />
                        {voice.state === "error" ? "Retry" : "Start Call"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          className="h-12 rounded-full bg-call-end px-7 text-call-end-foreground hover:bg-call-end/90"
                          onClick={() => void voice.endCall()}
                          aria-label="End call with Aria"
                        >
                          <Phone className="rotate-[135deg]" />
                          End Call
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-12 rounded-full px-5"
                          onClick={voice.isMuted ? voice.unmute : voice.mute}
                          aria-label={voice.isMuted ? "Unmute microphone" : "Mute microphone"}
                          aria-pressed={voice.isMuted}
                        >
                          {voice.isMuted ? <MicOff /> : <Mic />}
                          {voice.isMuted ? "Unmute" : "Mute"}
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Mic className="size-3.5" />
                    {micLabel}
                  </p>
                </div>
              </div>
            </section>
            <ConversationPanel transcript={voice.transcript} />
          </div>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.72fr)]">
          <section aria-labelledby="help-title">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Support, made simple
            </p>
            <h2 id="help-title" className="mt-1 font-display text-3xl">
              How can Aria help?
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {helpItems.map(({ icon: Icon, title, text }) => (
                <Button
                  key={title}
                  variant="outline"
                  className="group flex h-auto min-h-28 items-start justify-start gap-4 whitespace-normal rounded-lg border-border bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-card"
                  onClick={start}
                  aria-label={`Start with ${title}`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                    <Icon />
                  </span>
                  <span>
                    <strong className="block text-sm">{title}</strong>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                      {text}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </section>
          <OrderPanel />
        </div>
      </main>
      <footer className="border-t border-border py-7 text-center text-xs text-muted-foreground">
        <Headphones className="mr-2 inline size-4" />
        Aura Skincare customer care
      </footer>
    </div>
  );
}
