"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import { Typography } from "@/components/Typography";
import { getMyPayouts, type PayoutRow } from "@/lib/services/payout";
import { useAuthStore } from "@/store/authStore";
import { OwedBalanceCard } from "./OwedBalanceCard";
import { PayoutHistoryList } from "./PayoutHistoryList";

/**
 * `/seller/payouts` — Phase 7 surface. Shows:
 * - Pending payout (owedBalance) card with Cash out now button at the top
 * - Daily payout history below
 *
 * Both are 404-tolerant: until backend ships the GET endpoint + the
 * `owedBalance` field on /auth/me, the page shows zero owed and an empty
 * history. No errors, no surprises.
 */
export function PayoutsLoader() {
  const user = useAuthStore((s) => s.user);
  const [payouts, setPayouts] = useState<PayoutRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyPayouts()
      .then((page) => {
        if (cancelled) return;
        setPayouts(page.items);
      })
      .catch(() => {
        if (cancelled) return;
        setPayouts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (payouts === null) {
    return <PageLoader fullScreen={false} label="Loading payouts…" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-1">
        <Typography variant="overline" className="text-primary">
          Money in
        </Typography>
        <Typography variant="heading-h1">Payouts</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          Released funds settle to your bank every morning at 6 AM. Or cash
          out now if you can&apos;t wait.
        </Typography>
      </header>

      <OwedBalanceCard
        owedBalance={user?.owedBalance ?? "0"}
        hasPayoutAccount={user?.hasPayoutAccount ?? false}
        onPaid={() => {
          // Refetch the list so the new instant payout appears on top.
          getMyPayouts()
            .then((page) => setPayouts(page.items))
            .catch(() => undefined);
        }}
      />

      <section className="flex flex-col gap-3">
        <Typography variant="heading-h3">History</Typography>
        {payouts.length === 0 ? <HistoryEmpty /> : <PayoutHistoryList payouts={payouts} />}
      </section>
    </div>
  );
}

function HistoryEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Wallet className="size-5" />
      </span>
      <Typography variant="body-sm" className="max-w-xs text-muted-foreground">
        Once buyers confirm delivery on your sales, your payouts will show
        up here.
      </Typography>
    </div>
  );
}
