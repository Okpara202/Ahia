"use client";

import { useEffect } from "react";
import { AlertCircle, Check, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import {
  type Toast,
  type ToastVariant,
  useToastStore,
} from "@/store/toastStore";

// Errors stay up longer — the user needs time to read the cause and the
// "Try again" guidance. Success/info dismiss faster since they're
// acknowledgements, not diagnoses.
const TOAST_TTL_MS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  error: 8000,
};
const CONFIRM_TTL_MS = 3500;

const VARIANT_ICON: Record<ToastVariant, LucideIcon> = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

const VARIANT_TINT: Record<ToastVariant, string> = {
  success: "bg-success/15 text-success",
  error: "bg-destructive/15 text-destructive",
  info: "bg-primary/15 text-primary",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  const corner = toasts.filter((t) => t.placement === "corner");
  const center = toasts.filter((t) => t.placement === "center");

  return (
    <>
      {corner.length > 0 && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:top-6 sm:items-end"
        >
          {corner.map((t) => (
            <CornerToast key={t.id} toast={t} />
          ))}
        </div>
      )}

      {center.length > 0 && (
        <div
          aria-live="assertive"
          className="pointer-events-none fixed inset-x-0 top-6 z-60 flex justify-center px-4 sm:top-8"
        >
          <div className="flex flex-col items-center gap-2">
            {center.map((t) => (
              <CenterToast key={t.id} toast={t} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function CornerToast({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = VARIANT_ICON[toast.variant];

  useEffect(() => {
    const id = window.setTimeout(
      () => dismiss(toast.id),
      TOAST_TTL_MS[toast.variant]
    );
    return () => window.clearTimeout(id);
  }, [toast.id, toast.variant, dismiss]);

  return (
    <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg animate-in slide-in-from-top-3 fade-in duration-200">
      <span
        aria-hidden
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          VARIANT_TINT[toast.variant]
        )}
      >
        <Icon className="size-4" strokeWidth={2.5} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography variant="label-md">{toast.title}</Typography>
        {toast.description && (
          <Typography variant="caption" className="text-muted-foreground">
            {toast.description}
          </Typography>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * iOS HUD-style confirmation pill. Sits at top-center, slides down on enter,
 * click-to-dismiss, auto-dismisses in ~3.5s. Designed to acknowledge an
 * action without blocking the page — like Apple's "AirPods connected" or
 * "Added to Library" cards. Reserved for identity-level events fired
 * through `toast.confirm()`.
 */
function CenterToast({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = VARIANT_ICON[toast.variant];

  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), CONFIRM_TTL_MS);
    return () => window.clearTimeout(id);
  }, [toast.id, dismiss]);

  return (
    <button
      type="button"
      onClick={() => dismiss(toast.id)}
      className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-border/80 bg-card/95 px-4 py-2.5 text-left shadow-xl backdrop-blur-md animate-in slide-in-from-top-8 fade-in duration-300"
    >
      <span
        aria-hidden
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          VARIANT_TINT[toast.variant]
        )}
      >
        <Icon className="size-4" strokeWidth={2.5} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Typography variant="label-md" className="truncate">
          {toast.title}
        </Typography>
        {toast.description && (
          <Typography
            variant="caption"
            className="truncate text-muted-foreground"
          >
            {toast.description}
          </Typography>
        )}
      </div>
    </button>
  );
}
