"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/Textarea";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { raiseDispute } from "@/lib/services/disputes";
import { toast } from "@/store/toastStore";
import type { Transaction } from "@/types";

interface RaiseDisputeDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MIN_REASON = 20;
const MAX_REASON = 600;

export function RaiseDisputeDialog({
  transaction,
  open,
  onOpenChange,
}: RaiseDisputeDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset state every time the dialog opens. Closing dirties the textarea on
  // re-open without this, which surprised testers in the prototype run.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  const trimmed = reason.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_REASON;
  const tooLong = trimmed.length > MAX_REASON;
  const canSubmit = trimmed.length >= MIN_REASON && !tooLong && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await raiseDispute({
        transactionId: transaction.id,
        reason: trimmed,
      });
      toast.success(
        "Dispute opened",
        "An admin will review and reach out within 48 hours."
      );
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(
        "Couldn't open the dispute",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg gap-5">
        <AlertDialogHeader>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-lg bg-destructive/15 text-destructive"
            >
              <ShieldAlert className="size-4" />
            </span>
            <AlertDialogTitle>Raise a dispute</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Open a formal dispute against{" "}
            <span className="font-medium text-foreground">
              {transaction.shop.name}
            </span>{" "}
            for{" "}
            <span className="font-medium text-foreground">
              {transaction.product.name}
            </span>
            . An admin will read the conversation and decide a refund or
            release within 48 hours.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-3 text-warning-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <Typography variant="caption">
            Use this only after trying to resolve the issue in chat. False
            disputes can affect your buyer reputation.
          </Typography>
        </div>

        <div className="flex flex-col gap-1.5">
          <Textarea
            label="What went wrong?"
            placeholder="Describe the issue — item didn't arrive, not as described, damaged…"
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={
              tooLong ? `Keep it under ${MAX_REASON} characters.` : undefined
            }
          />
          <div className="flex items-center justify-between text-muted-foreground">
            <Typography variant="caption">
              {tooShort
                ? `Add at least ${MIN_REASON - trimmed.length} more character${
                    MIN_REASON - trimmed.length === 1 ? "" : "s"
                  }.`
                : "Be specific — admin only sees what you write here plus the chat."}
            </Typography>
            <Typography variant="caption">
              {trimmed.length}/{MAX_REASON}
            </Typography>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="cta"
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Opening dispute…" : "Open dispute"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
