"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import { getSellerTransactions } from "@/lib/services/seller";
import type { Transaction } from "@/types";
import { TransactionRow } from "./TransactionRow";

export function SellerTransactionsPanel() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSellerTransactions()
      .then((t) => {
        if (cancelled) return;
        setTransactions(t);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2
          aria-label="Loading transactions"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  const totalEarned = transactions
    .filter((t) => t.status === "released")
    .reduce((sum, t) => sum + (t.amount - t.platformFee), 0);
  const pending = transactions
    .filter((t) => t.status === "held")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-1">
        <Typography variant="heading-h1">Transactions</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Track your sales, payouts, and disputes.
        </Typography>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          label="Total earned"
          value={formatNaira(totalEarned)}
          hint="after platform fees"
        />
        <SummaryCard
          label="Pending payout"
          value={formatNaira(pending)}
          hint="held in escrow"
          tinted
        />
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Typography variant="body-sm" className="text-muted-foreground">
            No transactions yet. Sales will show up here.
          </Typography>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {transactions.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tinted,
}: {
  label: string;
  value: string;
  hint: string;
  tinted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border p-4 sm:p-5 ${
        tinted ? "border-warning/20 bg-warning/5" : "border-border bg-card"
      }`}
    >
      <Typography variant="caption" className="text-muted-foreground">
        {label}
      </Typography>
      <Typography variant="heading-h2">{value}</Typography>
      <Typography variant="caption" className="text-muted-foreground">
        {hint}
      </Typography>
    </div>
  );
}
