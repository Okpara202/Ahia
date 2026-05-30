"use client";

import { Loader2, Send, Trash2 } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";

export const MAX_RECORDING_MS = 3 * 60 * 1000;

interface VoiceRecorderBarProps {
  durationMs: number;
  starting?: boolean;
  onCancel: () => void;
  onSend: () => void;
}

function formatDuration(ms: number): string {
  const clamped = Math.min(ms, MAX_RECORDING_MS);
  const seconds = Math.floor(clamped / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Replaces the text input + image + mic + send row while a voice note is
 * being recorded. Click-to-start / click-to-send works for both mouse and
 * touch — keeps interaction parity across desktop and mobile.
 */
export function VoiceRecorderBar({
  durationMs,
  starting = false,
  onCancel,
  onSend,
}: VoiceRecorderBarProps) {
  const atCap = durationMs >= MAX_RECORDING_MS;
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2">
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel recording"
        title="Cancel"
        className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {starting ? (
          <>
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <Typography variant="body-sm" className="text-muted-foreground">
              Requesting mic…
            </Typography>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="relative grid size-3 shrink-0 place-items-center"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-destructive/60" />
              <span className="relative size-2 rounded-full bg-destructive" />
            </span>
            <Typography
              variant="label-md"
              className={cn(
                "font-mono tabular-nums",
                atCap && "text-destructive"
              )}
            >
              {formatDuration(durationMs)}
            </Typography>
            <Typography
              variant="caption"
              className="truncate text-muted-foreground"
            >
              {atCap ? "Max length reached" : "Recording…"}
            </Typography>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onSend}
        disabled={starting}
        aria-label="Send voice note"
        title="Send"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="size-4" />
      </button>
    </div>
  );
}
