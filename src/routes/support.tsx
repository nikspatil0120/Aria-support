import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Mic,
  MicOff,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  Undo2,
  Volume2,
  VolumeX,
  WalletCards,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AriaAvatar } from "@/components/support/AriaAvatar";
import { CallSummaryView } from "@/components/support/CallSummaryView";
import { ConnectingOverlay } from "@/components/support/ConnectingOverlay";
import { ConversationPanel } from "@/components/support/ConversationPanel";
import { OrderPanel } from "@/components/support/OrderPanel";
import { useVoiceSession } from "@/hooks/useVoiceSession";
import { getCallSummary, checkHealth, waitForBackendWakeup } from "@/lib/api";
import type { CallSummary, VoiceSessionState } from "@/types/support";
import botanicalImage from "@/assets/aura-botanical.jpg";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Aura Skincare | Talk to Aria" },
      { name: "description", content: "Voice support workspace. Talk to Aria about your Aura Skincare orders, shipping, returns and more." },
      { property: "og:title", content: "Aura Skincare | Talk to Aria" },
      { property: "og:description", content: "Voice support workspace. Talk to Aria about your Aura Skincare orders, shipping, returns and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Support,
});

const stateContent: Record<VoiceSessionState, { label: string; description: string }> = {
  idle:         { label: "Ready when you are",  description: "Tap Start Call to speak with Aria" },
  connecting:   { label: "Connecting",           description: "Preparing your session" },
  listening:    { label: "Listening",            description: "Aria is listening…" },
  thinking:     { label: "Thinking",             description: "Aria is working on that" },
  speaking:     { label: "Speaking",             description: "Aria is responding" },
  disconnected: { label: "Session ended",        description: "Your summary is ready below" },
  error:        { label: "Connection issue",     description: "Please try again" },
};

const helpItems = [
  { icon: Truck,       title: "Track an order",     text: "Real-time delivery status.",        prompt: "Where is my order ORD-101?" },
  { icon: Undo2,       title: "Returns & refunds",  text: "7-day return policy explained.",    prompt: "Can I return order ORD-102?" },
  { icon: ShieldCheck, title: "Shipping",            text: "Delivery times and charges.",       prompt: "What are the shipping options?" },
  { icon: XCircle,     title: "Cancellation",        text: "Cancel before it ships.",           prompt: "Can I cancel my order ORD-103?" },
  { icon: WalletCards, title: "Cash on Delivery",    text: "COD availability and limits.",      prompt: "Is Cash on Delivery available?" },
];

export function Support() {
  const voice = useVoiceSession();
  const [summary, setSummary] = useState<CallSummary>();
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [backendWaking, setBackendWaking] = useState(false);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const current = stateContent[voice.state];
  const isActive = ["listening", "thinking", "speaking"].includes(voice.state);

  // Check backend health on mount
  useEffect(() => {
    let mounted = true;
    
    checkHealth().then((healthy) => {
      if (mounted) {
        setBackendReady(healthy);
      }
    });
    
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    document.querySelectorAll<HTMLAudioElement>('audio[id^="aria-audio-"]').forEach((a) => {
      a.muted = voiceMuted;
    });
  }, [voiceMuted]);

  useEffect(() => {
    if (voice.state === "disconnected" && voice.sessionId && !summary) {
      setSummaryLoading(true);
      
      // Poll for summary every 2 seconds until found (max 50 attempts = 100 seconds)
      let attempts = 0;
      const maxAttempts = 50;
      
      const pollSummary = () => {
        attempts++;
        console.log(`Fetching summary attempt ${attempts}/${maxAttempts}...`);
        
        void getCallSummary(voice.sessionId!)
          .then((data) => {
            console.log("Summary received:", data);
            setSummary(data);
            setSummaryLoading(false);
          })
          .catch((err) => {
            console.error(`Summary attempt ${attempts} failed:`, err);
            if (attempts < maxAttempts) {
              setTimeout(pollSummary, 2000);
            } else {
              console.error("Max summary fetch attempts reached");
              setSummaryLoading(false);
            }
          });
      };
      
      pollSummary();
    }
  }, [voice.state, voice.sessionId, summary]);

  const start = async () => { 
    setSummary(undefined); 
    setSummaryLoading(false);
    
    // Check if backend is awake (Render free tier cold starts)
    if (backendReady === false) {
      setBackendWaking(true);
      toast.info("Waking up the server, this can take up to a minute...");
      
      const awake = await waitForBackendWakeup();
      setBackendWaking(false);
      
      if (!awake) {
        toast.error("Couldn't reach the server. Please try again in a moment.");
        return;
      }
      
      setBackendReady(true);
      toast.success("Server is ready!");
    }
    
    void voice.startCall(); 
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/15">

      {/* ════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30">
        {/* Glass bar */}
        <div
          className="border-b"
          style={{
            background: "color-mix(in oklab, var(--background) 82%, transparent)",
            backdropFilter: "blur(28px) saturate(1.5)",
            WebkitBackdropFilter: "blur(28px) saturate(1.5)",
            borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
          }}
        >
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">

            {/* Wordmark */}
            <div className="flex items-center gap-3.5">
              <div
                className="grid size-9 place-items-center rounded-full ring-1 ring-primary/20"
                style={{
                  background: "radial-gradient(135deg, color-mix(in oklab, var(--primary) 18%, transparent), color-mix(in oklab, var(--primary) 8%, transparent))",
                }}
              >
                <span className="font-display text-xl font-semibold text-primary">A</span>
              </div>
              <div>
                <strong className="block font-display text-lg leading-[1.1] tracking-[0.08em]">AURA</strong>
                <span className="block text-[8px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
                  Skincare
                </span>
              </div>
            </div>

            {/* Centre — session state */}
            {isActive && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-1.5 text-xs font-medium backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-online opacity-70" style={{ animationDuration: "1.4s" }} />
                  <span className="inline-flex size-1.5 rounded-full bg-online" />
                </span>
                {current.label}
              </div>
            )}

            {/* Right — online badge */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-online opacity-60" style={{ animationDuration: "2s" }} />
                <span className="inline-flex size-2 rounded-full bg-online" />
              </span>
              <span className="hidden sm:inline text-muted-foreground">Aria online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-7 sm:px-6 lg:px-10">

        {/* ── Error banner ── */}
        {voice.error && voice.state === "error" && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/6 px-4 py-3 text-sm text-destructive animate-fade-up">
            <XCircle className="size-4 shrink-0" />
            <div>
              <div><strong>Connection error:</strong> {voice.error}</div>
              {voice.error.toLowerCase().includes("permission") || 
               voice.error.toLowerCase().includes("notallowed") || 
               voice.error.toLowerCase().includes("denied") ? (
                <div className="mt-2 text-xs text-destructive/80">
                  Please allow microphone access in your browser settings and try again.
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            SUMMARY VIEW
        ════════════════════════════════════════════════════════ */}
        {voice.state === "disconnected" && (summary || summaryLoading) ? (
          summaryLoading ? (
            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-10">
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-luxury animate-scale-in">
                <div className="p-12 text-center">
                  <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-primary/10">
                    <div className="size-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  </div>
                  <h3 className="font-display text-2xl text-foreground">Generating Summary...</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Analyzing your conversation with Aria
                  </p>
                </div>
              </div>
              
              {/* Show transcript below while loading */}
              <div className="mt-8">
                <ConversationPanel 
                  transcript={voice.transcript} 
                  isConnected={false}
                />
              </div>
            </div>
          ) : summary ? (
            <CallSummaryView summary={summary} transcript={voice.transcript} onNewCall={start} />
          ) : null
        ) : (
          <>
            {/* ── Quick query chips ── */}
            {voice.isConnected && voice.sendTextMessage && (
              <div className="mb-6 flex flex-wrap items-center gap-2.5 animate-fade-up">
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Quick queries
                </span>
                {[
                  { label: "📦 ORD-101", msg: "Where is my order ORD-101?" },
                  { label: "🔄 Return ORD-102", msg: "Can I return order ORD-102?" },
                  { label: "🚫 Cancel ORD-103", msg: "I want to cancel order ORD-103" },
                ].map(({ label, msg }) => (
                  <button
                    key={label}
                    onClick={() => void voice.sendTextMessage?.(msg)}
                    className="group rounded-full border border-primary/25 bg-primary/6 px-4 py-1.5 text-[11px] font-semibold text-primary transition-all duration-200 hover:border-primary/50 hover:bg-primary/12 hover:scale-[1.04] active:scale-[0.97]"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* ════════════════════════════════════════════════════
                MAIN 2-COLUMN GRID
            ════════════════════════════════════════════════════ */}
            <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.72fr)]">

              {/* ── HERO ARIA PANEL ── */}
              <section
                className="relative overflow-hidden rounded-2xl border border-border/50 shadow-luxury"
                style={{ minHeight: 580 }}
                aria-labelledby="aria-title"
              >
                {/* Background photo */}
                <img
                  src={botanicalImage}
                  width={1536}
                  height={1024}
                  alt="Aura botanical serum with fresh leaves"
                  className="absolute inset-0 size-full object-cover object-center"
                />

                {/* Directional overlay — light comes from left */}
                <div className="absolute inset-0 bg-hero-overlay" />

                {/* Decorative glow orbs */}
                <div
                  className="absolute -bottom-32 -right-32 size-96 rounded-full blur-3xl pointer-events-none motion-safe:animate-glow-pulse"
                  style={{ background: "color-mix(in oklab, var(--primary) 12%, transparent)" }}
                />
                <div
                  className="absolute -top-20 right-24 size-64 rounded-full blur-3xl pointer-events-none motion-safe:animate-glow-pulse"
                  style={{ background: "color-mix(in oklab, var(--gold) 8%, transparent)", animationDelay: "2s" }}
                />

                {/* Connecting overlay */}
                <ConnectingOverlay
                  visible={(voice.state === "connecting" || voice.isConnected) && !voice.ariaAudioReady}
                />

                {/* Content */}
                <div
                  className="relative flex flex-col items-start justify-between p-7 sm:p-9 lg:p-12"
                  style={{ minHeight: 580 }}
                >
                  {/* Top — brand label */}
                  <div className="animate-fade-up">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/40 px-3.5 py-1.5 backdrop-blur-sm">
                      <Sparkles className="size-3 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                        Personal voice support
                      </span>
                    </div>
                    <h1
                      id="aria-title"
                      className="mt-4 font-display text-6xl sm:text-7xl lg:text-8xl leading-none text-foreground"
                    >
                      ARIA
                    </h1>
                    <p className="mt-1.5 font-display text-xl sm:text-2xl text-foreground/70">
                      Your Aura Skincare Assistant
                    </p>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                      Voice &amp; text support for orders, shipping, returns and more — available now.
                    </p>
                  </div>

                  {/* Centre — avatar */}
                  <div className="my-2 self-center motion-safe:animate-float">
                    <AriaAvatar state={voice.state} />
                  </div>

                  {/* Bottom — controls */}
                  <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: "0.1s" }}>
                    {/* State card */}
                    <div
                      className="mb-5 rounded-xl border border-border/40 px-5 py-3.5"
                      style={{
                        background: "color-mix(in oklab, var(--card) 65%, transparent)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                      }}
                      aria-live="polite"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`size-2 rounded-full transition-all duration-500 ${
                            isActive ? "bg-online scale-110 shadow-[0_0_8px_var(--color-online)]" : "bg-muted-foreground/40"
                          }`}
                        />
                        <span className="text-sm font-semibold">{current.label}</span>
                      </div>
                      <p className="mt-0.5 pl-4 text-xs text-muted-foreground">{current.description}</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-2.5">
                      {voice.state === "idle" || voice.state === "disconnected" || voice.state === "error" ? (
                        <Button
                          size="lg"
                          className="h-12 min-w-44 rounded-full px-8 font-semibold tracking-wide shadow-[0_4px_24px_color-mix(in_oklab,var(--primary)_30%,transparent)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_8px_32px_color-mix(in_oklab,var(--primary)_35%,transparent)] active:scale-[0.97]"
                          onClick={start}
                        >
                          <Phone className="size-4" />
                          {voice.state === "error" ? "Retry" : "Start Call"}
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="lg"
                            className="h-11 rounded-full bg-call-end px-6 text-call-end-foreground shadow-md transition-all hover:bg-call-end/90 hover:scale-[1.02] active:scale-[0.97]"
                            onClick={() => void voice.endCall()}
                          >
                            <Phone className="size-4 rotate-[135deg]" />
                            End Call
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className="h-11 rounded-full border-border/50 bg-card/50 px-5 backdrop-blur transition-all hover:scale-[1.02] hover:bg-card/80"
                            onClick={voice.isMuted ? voice.unmute : voice.mute}
                            aria-pressed={voice.isMuted}
                          >
                            {voice.isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                            {voice.isMuted ? "Unmute" : "Mute"}
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className="h-11 rounded-full border-border/50 bg-card/50 px-5 backdrop-blur transition-all hover:scale-[1.02] hover:bg-card/80"
                            onClick={() => setVoiceMuted((v) => !v)}
                            aria-pressed={voiceMuted}
                          >
                            {voiceMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                            {voiceMuted ? "Voice Off" : "Voice On"}
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Mic status */}
                    <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/70">
                      <Mic className="size-3" />
                      {voice.isMuted ? "Mic muted" : voice.isConnected ? "Mic active" : "Mic ready"}
                      {voice.isConnected && (
                        <>
                          <span className="opacity-30">·</span>
                          <Volume2 className="size-3" />
                          {voiceMuted ? "Voice off" : "Voice on"}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </section>

              {/* ── CONVERSATION PANEL ── */}
              <ConversationPanel
                transcript={voice.transcript}
                isConnected={voice.isConnected}
                onSendMessage={voice.sendTextMessage}
              />
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            LOWER SECTION — HELP CARDS + ORDERS
        ════════════════════════════════════════════════════════ */}
        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.68fr)]">

          {/* Help cards */}
          <section aria-labelledby="help-title">
            <div className="mb-6">
              <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
                Support, made simple
              </p>
              <h2 id="help-title" className="mt-2 font-display text-4xl">
                How can Aria help?
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {helpItems.map(({ icon: Icon, title, text, prompt }) => (
                <button
                  key={title}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 text-left shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    if (!voice.isConnected) {
                      start();
                      toast.info(`Try saying: "${prompt}"`, { duration: 6000 });
                    } else {
                      toast.info(`Try saying: "${prompt}"`, { duration: 5000 });
                    }
                  }}
                  disabled={voice.state === "connecting"}
                  aria-label={`Example: ${prompt}`}
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/4 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  <span
                    className="mb-3.5 grid size-10 place-items-center rounded-lg text-primary ring-1 ring-primary/15 transition-all duration-300 group-hover:ring-primary/30"
                    style={{ background: "color-mix(in oklab, var(--primary) 8%, var(--secondary))" }}
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <strong className="block text-sm font-semibold">{title}</strong>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span>
                  <span className="mt-2.5 block text-[11px] font-medium italic text-primary/60 transition-colors duration-200 group-hover:text-primary/80">
                    "{prompt}"
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Orders */}
          <OrderPanel refreshTick={voice.orderRefreshTick} />
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="font-display text-sm tracking-[0.1em] text-foreground/40">AURA SKINCARE</p>
            <p className="text-[11px] text-muted-foreground/60">
              Customer care powered by Aria AI · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Support;
