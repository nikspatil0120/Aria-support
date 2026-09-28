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

  return (
    <div className="relative grid size-44 place-items-center sm:size-52" aria-hidden="true">
      <div className={cn("absolute inset-0 rounded-full border border-avatar-ring", active && "motion-safe:animate-soft-pulse")} />
      <div className={cn("absolute inset-5 rounded-full border border-avatar-ring/60", state === "speaking" && "motion-safe:animate-wave")} />
      <div className="grid size-32 place-items-center rounded-full bg-avatar text-avatar-foreground shadow-avatar sm:size-36">
        <Icon className={cn("size-11 stroke-[1.4]", state === "connecting" && "motion-safe:animate-spin")} />
      </div>
      {state === "speaking" && (
        <div className="absolute bottom-2 flex h-5 items-end gap-1">
          {[12, 20, 15, 9, 18].map((height, index) => (
            <span key={height + index} className="w-1 rounded-full bg-primary motion-safe:animate-equalizer" style={{ height, animationDelay: `${index * 100}ms` }} />
          ))}
        </div>
      )}
    </div>
  );
}