"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary. Next.js App Router auto-wraps every page
 * under this route group in this boundary — any uncaught render or
 * effect error renders this UI instead of the whole tree crashing.
 *
 * Reasoning: we hit two separate full-page crashes recently — a
 * `formatNaira(undefined)` and a missing field on a backend response.
 * Without this boundary, every component-level crash takes down the
 * navigation shell with it. With it, the user sees a recovery card and
 * can click "Try again" or navigate elsewhere without a full reload.
 *
 * Lives at the app root. `app/global-error.tsx` exists for the rarer
 * case where the root layout itself crashes.
 */
export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Surface to the browser console for triage. `digest` is Next's
    // server-side error id — useful if we ever ship a Sentry / log
    // collector.
    const apiErr = extractApiError(error);
    console.error("[app-error-boundary]", {
      message: error.message,
      digest: error.digest,
      apiErr,
    });
  }, [error]);

  const apiErr = extractApiError(error);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-5 px-4 py-12 text-center">
      <span
        aria-hidden
        className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive"
      >
        <AlertTriangle className="size-7" />
      </span>
      <div className="flex flex-col gap-2">
        <Typography variant="heading-h2">Something went wrong</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          {apiErr?.message ??
            "An unexpected error broke this page. You can try again, or head back to the feed."}
        </Typography>
        {(error.digest || apiErr?.requestId) && (
          <Typography
            variant="caption"
            className="select-all font-mono text-muted-foreground/70"
          >
            ID: {apiErr?.requestId ?? error.digest}
          </Typography>
        )}
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button type="button" variant="cta" size="lg" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/feed">Back to feed</Link>
        </Button>
      </div>
    </div>
  );
}
