"use client";

import { useEffect } from "react";

import { LogoMark } from "@/components/Logo";
import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";

interface UploadOverlayProps {
  /** When true, the overlay is mounted and the screen is blocked. */
  open: boolean;
  /** Upload progress 0–100. When undefined, the bar shows an
   *  indeterminate animation — for phases where the browser can't tell
   *  us a real %  (e.g. server-side processing after the upload finishes). */
  progress?: number;
  /** Heading copy shown above the progress bar. Defaults to "Uploading…". */
  title?: string;
  /** Optional secondary line — e.g. "Don't close this tab." */
  hint?: string;
}

/**
 * Full-screen brand loader used during large uploads (products, stories,
 * Discover ads). Sits over the page on a backdrop with the Ahia mark
 * pulsing in the center and a progress bar pinned along the bottom of
 * the viewport.
 *
 * Pass `progress` (0–100) when you have a real % from `onUploadProgress`.
 * Omit it during the "request done, server is processing" tail where the
 * browser has no real signal — the bar shows an indeterminate sweep.
 */
export function UploadOverlay({
  open,
  progress,
  title = "Uploading…",
  hint,
}: UploadOverlayProps) {
  // Lock body scroll while the overlay is open so the user can't
  // accidentally scroll the page behind it.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const clamped =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : null;

  return (
    <div
      role="status"
      aria-label={title}
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative grid place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 -m-3 rounded-2xl bg-primary/40 animate-[ahia-ring-pulse_1.6s_ease-in-out_infinite]"
        />
        <span className="relative animate-[ahia-breath_1.6s_ease-in-out_infinite]">
          <LogoMark className="size-20 shadow-xl sm:size-24" />
        </span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Typography variant="heading-h3">{title}</Typography>
        {hint && (
          <Typography variant="body-sm" className="text-muted-foreground">
            {hint}
          </Typography>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-4 pb-6 sm:px-8 sm:pb-8">
        <div className="flex items-center justify-between">
          <Typography variant="caption" className="text-muted-foreground">
            {clamped === null ? "Finishing up…" : `${clamped}%`}
          </Typography>
          {clamped !== null && clamped < 100 && (
            <Typography variant="caption" className="text-muted-foreground">
              Hang tight
            </Typography>
          )}
        </div>
        <div
          aria-hidden
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          {clamped === null ? (
            <span
              className={cn(
                "block h-full w-1/3 rounded-full bg-primary",
                "animate-[ahia-progress-indeterminate_1.8s_linear_infinite]"
              )}
            />
          ) : (
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${clamped}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
