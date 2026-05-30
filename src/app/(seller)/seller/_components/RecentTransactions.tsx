import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const STATUS_LABEL: Record<TransactionStatus, string> = {
  held: "In escrow",
  partial_released: "Partially paid",
  fully_released: "Paid out",
  partial_refunded: "Partial refund",
  fully_refunded: "Refunded",
};

const STATUS_TINT: Record<TransactionStatus, string> = {
  held: "bg-warning/20 text-warning",
  partial_released: "bg-primary/15 text-primary",
  fully_released: "bg-success/15 text-success",
  partial_refunded: "bg-accent/15 text-accent",
  fully_refunded: "bg-muted text-muted-foreground",
};

const num = (s: string) => Number(s) || 0;

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <header className="flex items-center justify-between">
        <Typography variant="heading-h4">Recent sales</Typography>
        <Link
          href="/seller/transactions"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <Typography variant="label-sm">View all</Typography>
          <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {transactions.length === 0 ? (
        <Typography
          variant="body-sm"
          className="py-6 text-center text-muted-foreground"
        >
          No sales yet.
        </Typography>
      ) : (
        <ul className="flex flex-col gap-2">
          {transactions.map((t) => {
            const lineSummary =
              t.invoice.lines.length === 1
                ? t.invoice.lines[0].name
                : `${t.invoice.lines.length} items`;
            const payout = num(t.totalPaid) - num(t.platformFee);
            return (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <Typography variant="label-md" className="truncate">
                    {lineSummary}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-muted-foreground"
                  >
                    {t.buyer.name} · {formatRelativeTime(t.paidAt)}
                  </Typography>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Typography variant="price-sm" className="text-foreground">
                    {formatNaira(payout)}
                  </Typography>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5",
                      STATUS_TINT[t.status]
                    )}
                  >
                    <Typography variant="label-sm">
                      {STATUS_LABEL[t.status]}
                    </Typography>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
