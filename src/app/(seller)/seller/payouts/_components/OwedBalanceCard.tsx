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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { cashOutInstant } from "@/lib/services/payout";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

interface OwedBalanceCardProps {
  /** Decimal string. */
  owedBalance: string;
  hasPayoutAccount: boolean;
  /** Called after a successful instant payout so the parent refreshes the
   *  history list. */
  onPaid: () => void;
}

const INSTANT_FEE_NAIRA = 25;

/**
 * Pending payout card with Cash out now action. Three states:
 * - Zero balance → muted card with "Nothing to pay out yet"
 * - Has balance, no account → CTA to add a payout account
 * - Has balance + account → Cash out now button (with fee disclosure)
 */
export function OwedBalanceCard({
  owedBalance,
  hasPayoutAccount,
  onPaid,
}: OwedBalanceCardProps) {
  const [cashingOut, setCashingOut] = useState(false);
  const owed = Number(owedBalance);
  const net = Math.max(0, owed - INSTANT_FEE_NAIRA);

  async function handleCashOut() {
    if (cashingOut) return;
    setCashingOut(true);
    try {
      const result = await cashOutInstant();
      // Zero out the local owedBalance so the card flips to the empty
      // state immediately. Backend's next /auth/me will confirm.
      useAuthStore.setState((s) =>
        s.user ? { user: { ...s.user, owedBalance: "0" } } : {}
      );
      toast.confirm(
        "Cash out queued",
        `${formatNaira(Number(result.net))} on the way — landing in your bank shortly.`
      );
      onPaid();
    } catch (err) {
      const apiErr = extractApiError(err);
      toast.error(
        "Cash out didn't go through",
        apiErr?.message ??
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
            Next sweep: tomorrow 6 AM. Money lands in your bank Mon–Fri.
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="cta"
              size="lg"
              disabled={cashingOut || net <= 0}
            >
              {cashingOut && <Loader2 className="size-4 animate-spin" />}
              <Zap className="size-4" />
              {cashingOut ? "Sending…" : `Cash out now (${formatNaira(net)})`}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cash out {formatNaira(owed)} now?</AlertDialogTitle>
              <AlertDialogDescription>
                A {formatNaira(INSTANT_FEE_NAIRA)} Paystack Transfer fee
                applies. {formatNaira(net)} will land in your bank
                account within a few minutes — usually instantly during
                bank hours. Waiting for tomorrow&apos;s 6 AM sweep is free.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Wait for sweep</AlertDialogCancel>
              <AlertDialogAction onClick={handleCashOut}>
                Cash out {formatNaira(net)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
