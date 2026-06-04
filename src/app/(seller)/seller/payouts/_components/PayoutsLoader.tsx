"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

import { PageLoader } from "@/components/PageLoader";
import { Typography } from "@/components/Typography";
import { getMyPayouts, type PayoutRow } from "@/lib/services/payout";
import { useAuthStore } from "@/store/authStore";
import { OwedBalanceCard } from "./OwedBalanceCard";
import { PayoutHistoryList } from "./PayoutHistoryList";

interface LoadedPage {
  items: PayoutRow[];
  owedBalance: string;
}

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
  const [page, setPage] = useState<LoadedPage | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyPayouts()
      .then((p) => {
        if (cancelled) return;
        setPage({ items: p.items, owedBalance: p.owedBalance });
        // Backend echoes the live owedBalance — keep auth store in sync so
        // dashboards/banners stay accurate without an extra /auth/me hit.
        if (user) {
          useAuthStore.setState((s) =>
            s.user ? { user: { ...s.user, owedBalance: p.owedBalance } } : {}
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPage({ items: [], owedBalance: user?.owedBalance ?? "0" });
      });
    return () => {
      cancelled = true;
    };
    // user only read once at first mount; refetch flow uses the closure
    // re-bound inside the onPaid callback below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (page === null) {
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
        owedBalance={page.owedBalance}
        hasPayoutAccount={user?.hasPayoutAccount ?? false}
        onPaid={() => {
          // Refetch so the new cash-out row appears on top + owedBalance
          // reflects the post-payout zero.
          getMyPayouts()
            .then((p) =>
              setPage({ items: p.items, owedBalance: p.owedBalance })
            )
            .catch(() => undefined);
        }}
      />

      <section className="flex flex-col gap-3">
        <Typography variant="heading-h3">History</Typography>
        {page.items.length === 0 ? (
          <HistoryEmpty />
        ) : (
          <PayoutHistoryList payouts={page.items} />
        )}
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
