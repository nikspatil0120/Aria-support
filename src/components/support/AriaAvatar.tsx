import { AudioLines, Ear, LoaderCircle, MessageCircleMore, Sprout } from "lucide-react";
import type { VoiceSessionState } from "@/types/support";
import { cn } from "@/lib/utils";

const icons = {
  idle: Sprout,
  connecting: LoaderCircle,
  listening: Ear,
  thinking: MessageCircleMore,
  speaking: AudioLines,
  disconnected: Sprout,
  error: Sprout,
};

export function AriaAvatar({ state }: { state: VoiceSessionState }) {
  const Icon = icons[state];
  const active = ["connecting", "listening", "thinking", "speaking"].includes(state);
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  return (
    <div className="relative grid size-48 place-items-center sm:size-56" aria-hidden="true">

      {/* Outermost ambient glow ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-700",
          active ? "opacity-100" : "opacity-0",
        )}
        style={{
          background: "radial-gradient(circle, oklch(0.42 0.09 150 / 18%) 0%, transparent 70%)",
        }}
      />

      {/* Orbit ring 1 */}
      <div
        className={cn(
          "absolute inset-4 rounded-full border-2 transition-opacity duration-700",
          active ? "opacity-60" : "opacity-20",
          isSpeaking && "motion-safe:animate-wave",
        )}
        style={{ borderColor: "oklch(0.42 0.09 150 / 35%)" }}
      />

      {/* Orbit ring 2 */}
      <div
        className={cn(
          "absolute inset-9 rounded-full border transition-all duration-700",
          active ? "opacity-80" : "opacity-30",
          active && "motion-safe:animate-soft-pulse",
        )}
        style={{ borderColor: "oklch(0.42 0.09 150 / 50%)" }}
      />

      {/* Speaking bars backdrop ring */}
      {isSpeaking && (
        <div className="absolute inset-2 rounded-full border border-primary/15 motion-safe:animate-soft-pulse" />
      )}

      {/* Main avatar circle */}
      <div
        className={cn(
          "relative grid size-36 place-items-center rounded-full transition-all duration-500 sm:size-40",
          "shadow-avatar",
        )}
        style={{
          background: `linear-gradient(145deg,
            oklch(0.50 0.10 148) 0%,
            oklch(0.38 0.085 146) 50%,
            oklch(0.28 0.07 144) 100%)`,
          boxShadow: "0 20px 60px oklch(0.38 0.085 146 / 40%), 0 4px 16px oklch(0.38 0.085 146 / 25%)",
        }}
      >
        {/* Inner gloss highlight */}
        <div
          className="absolute inset-0 rounded-full opacity-25"
          style={{
            background: "radial-gradient(ellipse at 35% 25%, white 0%, transparent 55%)",
          }}
        />

        <Icon
          className={cn(
            "relative z-10 size-12 stroke-[1.3] sm:size-14",
            state === "connecting" && "motion-safe:animate-spin",
            isListening && "motion-safe:animate-soft-pulse",
          )}
          style={{ color: "oklch(0.97 0.02 100)" }}
        />
      </div>

      {/* Speaking equalizer bars */}
      {isSpeaking && (
        <div className="absolute -bottom-1 flex h-6 items-end gap-[3px]">
          {[10, 18, 24, 14, 20, 16, 22, 12].map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full motion-safe:animate-equalizer"
              style={{
                height: h,
                background: "oklch(0.42 0.09 150)",
                animationDelay: `${i * 80}ms`,
                animationDuration: `${0.7 + (i % 3) * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Listening ripple */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full border border-primary/20 motion-safe:animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute inset-3 rounded-full border border-primary/15 motion-safe:animate-ping" style={{ animationDuration: "2.4s", animationDelay: "0.4s" }} />
        </>
      )}
    </div>
  );
}
