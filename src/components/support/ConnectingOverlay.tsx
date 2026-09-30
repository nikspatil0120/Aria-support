import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConnectingOverlayProps {
  visible: boolean;
}

const steps = [
  { label: "Initialising session", duration: 1200 },
  { label: "Connecting to Aria", duration: 2000 },
  { label: "Warming up voice pipeline", duration: 1600 },
];

export function ConnectingOverlay({ visible }: ConnectingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) { setStepIndex(0); setMounted(true); }
  }, [visible]);

  useEffect(() => {
    if (!visible || stepIndex >= steps.length - 1) return;
    const t = setTimeout(() => setStepIndex((i) => i + 1), steps[stepIndex]!.duration);
    return () => clearTimeout(t);
  }, [visible, stepIndex]);

  useEffect(() => {
    if (!visible && mounted) {
      const t = setTimeout(() => setMounted(false), 700);
      return () => clearTimeout(t);
    }
  }, [visible, mounted]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl",
        "transition-opacity duration-700",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      style={{
        background: "linear-gradient(135deg, color-mix(in oklab, var(--card) 94%, transparent) 0%, color-mix(in oklab, var(--card) 86%, transparent) 100%)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
      }}
      aria-live="polite"
      aria-label="Connecting to Aria"
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div
          className="absolute -top-16 -left-16 size-64 rounded-full blur-3xl motion-safe:animate-glow-pulse"
          style={{ background: "color-mix(in oklab, var(--primary) 10%, transparent)" }}
        />
        <div
          className="absolute -bottom-16 -right-16 size-56 rounded-full blur-3xl motion-safe:animate-glow-pulse"
          style={{ background: "color-mix(in oklab, var(--primary) 8%, transparent)", animationDelay: "2s" }}
        />
      </div>

      {/* Logo mark */}
      <div className="relative mb-10">
        {/* Orbit rings */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-primary/25 motion-safe:animate-ping"
            style={{
              inset: -i * 14,
              animationDelay: `${i * 500}ms`,
              animationDuration: "2.2s",
            }}
          />
        ))}

        {/* Core */}
        <div
          className="relative grid size-24 place-items-center rounded-full shadow-avatar"
          style={{
            background: `radial-gradient(135deg at 30% 25%,
              color-mix(in oklab, var(--primary) 75%, white) 0%,
              var(--avatar) 55%,
              color-mix(in oklab, var(--primary) 88%, black) 100%)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-25"
            style={{ background: "radial-gradient(ellipse at 35% 25%, white 0%, transparent 55%)" }}
          />
          <span className="relative font-display text-4xl font-semibold text-avatar-foreground">A</span>
        </div>
      </div>

      {/* Text */}
      <p className="font-display text-2xl text-foreground">Connecting to Aria</p>
      <p
        key={stepIndex}
        className="mt-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-400"
      >
        {steps[stepIndex]?.label ?? "Almost ready…"}
      </p>

      {/* Step progress */}
      <div className="mt-8 flex gap-2.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className="relative h-1 overflow-hidden rounded-full transition-all duration-700"
            style={{ width: i === stepIndex ? 28 : 8 }}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-full transition-colors duration-500",
                i < stepIndex
                  ? "bg-primary"
                  : i === stepIndex
                  ? "bg-primary animate-shimmer-bg"
                  : "bg-border",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
