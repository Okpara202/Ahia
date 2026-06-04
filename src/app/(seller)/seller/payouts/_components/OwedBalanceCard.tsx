"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import {
  cashOutNow,
  previewCashOut,
  type CashOutPreview,
} from "@/lib/services/payout";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

interface OwedBalanceCardProps {
  /** Decimal string. Drives the headline number. */
  owedBalance: string;
  hasPayoutAccount: boolean;
  /** Called after a successful instant payout so the parent refreshes the
   *  history list. */
  onPaid: () => void;
}

/**
 * Pending payout card with Cash out now action.
 *
 * Three render states:
 * - Zero balance → muted card with "Nothing to pay out yet"
 * - Has balance, no account → CTA to add a payout account
 * - Has balance + account → Cash out now button. Tapping it fetches the
 *   live preview from backend (source-of-truth fee + surcharge math) and
 *   shows a confirmation dialog before firing the actual cash-out.
 *
 * We never compute the surcharge locally — the backend's preview endpoint
 * is the only place the number lives so the UI can never drift.
 */
export function OwedBalanceCard({
  owedBalance,
  hasPayoutAccount,
  onPaid,
}: OwedBalanceCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<CashOutPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);
  const owed = Number(owedBalance);

  async function openCashOutDialog() {
    if (loadingPreview || cashingOut) return;
    setLoadingPreview(true);
    try {
      const p = await previewCashOut();
      setPreview(p);
      setDialogOpen(true);
    } catch (err) {
      toast.fromApiError("Couldn't load cash-out details", err);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleConfirm() {
    if (cashingOut) return;
    setCashingOut(true);
    try {
      const result = await cashOutNow();
      // Zero the local owedBalance so the card flips to the empty state
      // immediately. Backend's next /auth/me will confirm.
      useAuthStore.setState((s) =>
        s.user ? { user: { ...s.user, owedBalance: "0" } } : {}
      );
      toast.confirm(
        "Cash out sent",
        `${formatNaira(Number(result.netToSeller))} on the way — landing in your bank shortly.`
      );
      setDialogOpen(false);
      onPaid();
    } catch (err) {
      toast.fromApiError(
        "Cash out didn't go through",
        err,
        "Your balance is untouched. Try again in a moment."
      );
    } finally {
      setCashingOut(false);
    }
  }

  if (owed <= 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"
        >
          <Zap className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <Typography variant="heading-h4">Nothing to pay out yet</Typography>
          <Typography variant="caption" className="text-muted-foreground">
            Confirmed sales will accumulate here. Daily sweep settles at 6 AM.
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="overline" className="text-primary">
              Pending payout
            </Typography>
            <Typography
              variant="display-md"
              className="font-mono tabular-nums text-foreground"
            >
              {formatNaira(owed)}
            </Typography>
            <Typography variant="caption" className="text-muted-foreground">
              Next sweep: tomorrow 6 AM. Free. Or cash out now (small fee).
            </Typography>
          </div>
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
          >
            <Zap className="size-5" />
          </span>
        </div>

        {!hasPayoutAccount ? (
          <div className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-accent/10 p-3">
            <Typography variant="caption" className="text-muted-foreground">
              You need a bank account on file before we can transfer this.
            </Typography>
            <Button asChild variant="cta" size="sm" className="w-fit">
              <Link href="/seller/shop">Add payout account</Link>
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="cta"
            size="lg"
            onClick={openCashOutDialog}
            disabled={loadingPreview || cashingOut}
          >
            {loadingPreview && <Loader2 className="size-4 animate-spin" />}
            <Zap className="size-4" />
            {loadingPreview ? "Checking…" : "Cash out now"}
          </Button>
        )}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          {preview && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Cash out now?</AlertDialogTitle>
                <AlertDialogDescription>
                  {preview.eligible
                    ? "Money usually lands within a few minutes during bank hours. Waiting for tomorrow's 6 AM sweep is free."
                    : ineligibleCopy(preview)}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {preview.eligible && <Breakdown preview={preview} />}

              <AlertDialogFooter>
                <AlertDialogCancel>
                  {preview.eligible ? "Wait for sweep" : "Close"}
                </AlertDialogCancel>
                {preview.eligible && (
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      void handleConfirm();
                    }}
                    disabled={cashingOut}
                  >
                    {cashingOut && <Loader2 className="size-4 animate-spin" />}
                    {cashingOut
                      ? "Sending…"
                      : `Send ${formatNaira(Number(preview.netToSeller))}`}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Breakdown({ preview }: { preview: CashOutPreview }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 font-mono text-sm tabular-nums">
      <Row label="Owed to you" value={formatNaira(Number(preview.owedBalance))} />
      <Row
        label="Paystack fee"
        value={`− ${formatNaira(Number(preview.paystackFee))}`}
        muted
      />
      <Row
        label="Ahia surcharge (1%)"
        value={`− ${formatNaira(Number(preview.ahiaSurcharge))}`}
        muted
      />
      <div className="my-1 h-px bg-border" />
      <Row
        label="You receive"
        value={formatNaira(Number(preview.netToSeller))}
        strong
      />
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <Typography
        variant="caption"
        className={muted ? "text-muted-foreground" : undefined}
      >
        {label}
      </Typography>
      <span className={strong ? "font-bold" : muted ? "text-muted-foreground" : ""}>
        {value}
      </span>
    </div>
  );
}

function ineligibleCopy(preview: CashOutPreview): string {
  switch (preview.reason) {
    case "below_minimum":
      return "Cash out needs at least ₦500 in your owed balance. Wait for a few more sales to accumulate.";
    case "no_payout_account":
      return "Add a payout account first — we can't send money without one.";
    case "rate_limited":
      return "You've already cashed out in the last 24 hours. Try again later or wait for tomorrow's free sweep.";
    case "cooldown":
      return "Your last cash-out had a Paystack issue. Try again in about an hour.";
    default:
      return "Can't cash out right now. Try again in a moment.";
  }
}
