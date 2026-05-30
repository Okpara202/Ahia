"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Camera,
  Loader2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import { Portal } from "@/components/Portal";
import { Typography } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { extractApiError } from "@/lib/api";
import { disputeInvoiceLine } from "@/lib/services/conversations";
import { compressImageIfNeeded, formatBytes } from "@/lib/image";
import { toast } from "@/store/toastStore";
import type { InvoiceLine } from "@/types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MIN_REASON_LEN = 5;
const MAX_REASON_LEN = 2000;

interface DisputeLineDialogProps {
  lineId: string;
  lineName: string;
  onClose: () => void;
  /** Backend returns just `{ line, dispute }` — no updated invoice. Parent
   *  patches the line in-place in the message. */
  onSubmitted: (line: InvoiceLine) => void;
}

/**
 * Per-line dispute capture. Required reason text + optional evidence photo
 * (compressed before upload via `compressImageIfNeeded`). Admin reviews
 * the chat history alongside the reason and evidence.
 */
export function DisputeLineDialog({
  lineId,
  lineName,
  onClose,
  onSubmitted,
}: DisputeLineDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    return () => {
      if (evidence) URL.revokeObjectURL(evidence.previewUrl);
    };
  }, [evidence]);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setOptimizing(true);
    try {
      const result = await compressImageIfNeeded(file);
      if (result.file.size > MAX_FILE_BYTES) {
        toast.error(
          "Photo too large",
          `Even after optimizing, ${formatBytes(
            result.file.size
          )} is over the limit.`
        );
        return;
      }
      if (evidence) URL.revokeObjectURL(evidence.previewUrl);
      setEvidence({
        file: result.file,
        previewUrl: URL.createObjectURL(result.file),
      });
      if (result.compressed) {
        toast.success(
          "Optimized for faster upload",
          `${formatBytes(result.originalBytes)} → ${formatBytes(
            result.outputBytes
          )}.`
        );
      }
    } catch (err) {
      console.warn("[dispute-evidence-compress] failed", err);
      toast.error(
        "Couldn't read that photo",
        "Try a different file or use JPEG/PNG."
      );
    } finally {
      setOptimizing(false);
    }
  }

  function clearEvidence() {
    if (evidence) URL.revokeObjectURL(evidence.previewUrl);
    setEvidence(null);
  }

  async function handleSubmit() {
    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON_LEN) {
      toast.error(
        "A bit more detail",
        `Tell us what went wrong (at least ${MIN_REASON_LEN} characters).`
      );
      return;
    }
    setSubmitting(true);
    try {
      const { line: updatedLine } = await disputeInvoiceLine(lineId, {
        reason: trimmed,
        evidence: evidence?.file,
      });
      onSubmitted(updatedLine);
      toast.confirm(
        "Dispute opened",
        "An admin will review and decide within 48 hours."
      );
    } catch (err) {
      const apiErr = extractApiError(err);
      toast.error(
        "Couldn't open dispute",
        apiErr?.message ?? "Try again in a moment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = MAX_REASON_LEN - reason.length;

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
            <span className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" />
            </span>
            <div className="flex flex-col">
              <Typography variant="heading-h3">Dispute this line</Typography>
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
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <Typography variant="caption" className="text-muted-foreground">
                Funds for this line stay in escrow while an admin reviews. They
                can read this chat thread to verify what was agreed.
              </Typography>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="flex flex-col gap-1.5">
                <Typography variant="label-sm">
                  What happened? <span className="text-destructive">*</span>
                </Typography>
                <textarea
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value.slice(0, MAX_REASON_LEN))
                  }
                  rows={4}
                  placeholder="e.g. The sandals arrived in the wrong colour — I asked for brown, got black."
                  className="flex w-full resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-input/30"
                />
              </label>
              <Typography
                variant="caption"
                className="self-end font-mono tabular-nums text-muted-foreground"
              >
                {remaining}
              </Typography>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="label-sm">
                Evidence photo (optional)
              </Typography>
              {evidence ? (
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src={evidence.previewUrl}
                    alt="Evidence preview"
                    fill
                    sizes="400px"
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={clearEvidence}
                    aria-label="Remove evidence"
                    className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={optimizing}
                  className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-card text-primary">
                    {optimizing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <Typography variant="label-md">
                      {optimizing ? "Optimizing…" : "Add a photo"}
                    </Typography>
                    <Typography
                      variant="caption"
                      className="text-muted-foreground"
                    >
                      Helps an admin decide faster
                    </Typography>
                  </div>
                  <Upload className="ml-auto size-4 text-muted-foreground" />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-border bg-card px-5 py-4 sm:px-6">
          <Button
            onClick={handleSubmit}
            variant="cta"
            size="lg"
            disabled={
              submitting || optimizing || reason.trim().length < MIN_REASON_LEN
            }
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Opening dispute…
              </>
            ) : (
              "Open dispute"
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="lg"
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
