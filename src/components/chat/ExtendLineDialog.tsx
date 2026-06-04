"use client";

import { useEffect, useState } from "react";
import {
  Bus,
  Check,
  Clock,
  Loader2,
  PackageSearch,
  Plane,
  Sparkles,
  X,
} from "lucide-react";

import { Portal } from "@/components/Portal";
import { Typography } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { extractApiError } from "@/lib/api";
import { extendInvoiceLine } from "@/lib/services/conversations";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import type { InvoiceLine } from "@/types";

const MIN_REASON_LEN = 3;
const MAX_REASON_LEN = 200;

interface ExtendLineDialogProps {
  lineId: string;
  lineName: string;
  onClose: () => void;
  /** Receives the updated line (autoReleaseAt, extendedAt, extensionReason
   *  all set). Parent merges into the message's invoice. */
  onSubmitted: (line: InvoiceLine) => void;
}

interface ReasonPreset {
  label: string;
  icon: React.ReactNode;
  hint: string;
}

const PRESETS: ReasonPreset[] = [
  {
    label: "Still in transit",
    icon: <Bus className="size-4" />,
    hint: "Goods are on the way",
  },
  {
    label: "Just received, inspecting",
    icon: <PackageSearch className="size-4" />,
    hint: "Need to check before confirming",
  },
  {
    label: "Travelling, back soon",
    icon: <Plane className="size-4" />,
    hint: "Will confirm when I return",
  },
];

const CUSTOM_KEY = "__custom__";

export function ExtendLineDialog({
  lineId,
  lineName,
  onClose,
  onSubmitted,
}: ExtendLineDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const reason =
    selected === CUSTOM_KEY ? custom.trim() : selected ?? "";
  const canSubmit =
    !submitting && reason.length >= MIN_REASON_LEN;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const updated = await extendInvoiceLine(lineId, reason);
      onSubmitted(updated);
      toast.confirm(
        "Extended by 7 days",
        "Take your time. We've let the seller know."
      );
    } catch (err) {
      const apiErr = extractApiError(err);
      const code = apiErr?.code;
      if (code === "already_extended") {
        toast.error(
          "Already extended",
          "This line has been extended once already."
        );
      } else {
        toast.error(
          "Couldn't extend",
          apiErr?.message ?? "Try again in a moment.",
          apiErr?.requestId
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:max-h-[82dvh]">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Clock className="size-4" />
            </span>
            <div className="flex flex-col">
              <Typography variant="heading-h3">Need more time?</Typography>
              <Typography
                variant="caption"
                className="line-clamp-1 text-muted-foreground"
              >
                {lineName}
              </Typography>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-2xl bg-muted/40 p-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <Typography variant="caption" className="text-muted-foreground">
                Your money stays held for another 7 days. Pick a reason so the
                seller knows what to expect.
              </Typography>
            </div>

            <div className="flex flex-col gap-2">
              {PRESETS.map((p) => (
                <PresetButton
                  key={p.label}
                  active={selected === p.label}
                  icon={p.icon}
                  label={p.label}
                  hint={p.hint}
                  onClick={() => setSelected(p.label)}
                />
              ))}
              <PresetButton
                active={selected === CUSTOM_KEY}
                icon={<Sparkles className="size-4" />}
                label="Something else"
                hint="Write a short note"
                onClick={() => setSelected(CUSTOM_KEY)}
              />
            </div>

            {selected === CUSTOM_KEY && (
              <div className="flex flex-col gap-1.5">
                <label className="flex flex-col gap-1.5">
                  <Typography variant="label-sm">Your reason</Typography>
                  <textarea
                    value={custom}
                    onChange={(e) =>
                      setCustom(e.target.value.slice(0, MAX_REASON_LEN))
                    }
                    rows={3}
                    autoFocus
                    placeholder="e.g. Rider couldn't reach me today, rescheduled for Saturday."
                    className="flex w-full resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-input/30"
                  />
                </label>
                <Typography
                  variant="caption"
                  className="self-end font-mono tabular-nums text-muted-foreground"
                >
                  {MAX_REASON_LEN - custom.length}
                </Typography>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-border bg-card px-5 py-4 sm:px-6">
          <Button
            onClick={handleSubmit}
            variant="cta"
            size="lg"
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Extending…
              </>
            ) : (
              "Extend by 7 days"
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="lg"
            disabled={submitting}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

interface PresetButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}

function PresetButton({
  active,
  icon,
  label,
  hint,
  onClick,
}: PresetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-card px-3 py-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-primary/5"
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary"
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Typography variant="label-md">{label}</Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {hint}
        </Typography>
      </div>
      {active && <Check className="size-4 shrink-0 text-primary" />}
    </button>
  );
}
