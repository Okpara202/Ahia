"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";

interface VoicePlayerProps {
  voiceUrl: string;
  durationMs: number;
  mine: boolean;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Inline voice-note player. Click to play/pause, progress bar tracks
 * playback. No waveform for v1 — adding one means decoding the audio
 * buffer client-side, which we'll wire later if users ask for it.
 *
 * Duration label counts UP while playing, shows total when idle.
 */
export function VoicePlayer({ voiceUrl, durationMs, mine }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentMs(audio.currentTime * 1000);
    const onEnd = () => {
      setPlaying(false);
      setCurrentMs(0);
    };
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {
        // Browser blocked autoplay or src failed to load — silently ignore;
        // the user can retry.
      });
    } else {
      audio.pause();
    }
  }

  const progress =
    durationMs > 0 ? Math.min(100, (currentMs / durationMs) * 100) : 0;
  const displayMs = currentMs > 0 ? currentMs : durationMs;

  return (
    <div
      className={cn(
        "flex max-w-[80%] items-center gap-3 rounded-2xl px-3 py-2 shadow-xs sm:max-w-[70%]",
        mine
          ? "self-end bg-primary text-primary-foreground"
          : "self-start bg-card text-foreground"
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full transition-opacity hover:opacity-90",
          mine
            ? "bg-primary-foreground/15 text-primary-foreground"
            : "bg-primary/15 text-primary"
        )}
      >
        {playing ? (
          <Pause className="size-4" />
        ) : (
          <Play className="size-4 translate-x-px" />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div
          className={cn(
            "relative h-1 w-full overflow-hidden rounded-full",
            mine ? "bg-primary-foreground/20" : "bg-muted"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width] duration-100",
              mine ? "bg-primary-foreground" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Mic
            className={cn(
              "size-3",
              mine ? "opacity-70" : "text-muted-foreground"
            )}
          />
          <Typography
            variant="caption"
            className={cn(
              "font-mono tabular-nums",
              mine ? "opacity-80" : "text-muted-foreground"
            )}
          >
            {formatDuration(displayMs)}
          </Typography>
        </div>
      </div>
      <audio ref={audioRef} src={voiceUrl} preload="metadata" />
    </div>
  );
}
