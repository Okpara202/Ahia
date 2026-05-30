import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: "Pending",
  held: "In escrow",
  released: "Paid out",
  refunded: "Refunded",
  cancelled: "Cancelled",
  disputed: "Disputed",
  resolved_buyer: "Refunded",
  resolved_seller: "Paid out",
};

const STATUS_TINT: Record<TransactionStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  held: "bg-warning/20 text-warning",
  released: "bg-success/15 text-success",
  refunded: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
  disputed: "bg-destructive/15 text-destructive",
  resolved_buyer: "bg-muted text-muted-foreground",
  resolved_seller: "bg-success/15 text-success",
};

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
        <Typography variant="body-sm" className="py-6 text-center text-muted-foreground">
          No sales yet.
        </Typography>
      ) : (
        <ul className="flex flex-col gap-2">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {t.product.media.type === "image" ? (
                  <Image
                    src={t.product.media.url}
                    alt={t.product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src={t.product.media.poster ?? ""}
                    alt={t.product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <Typography variant="label-md" className="truncate">
                  {t.product.name}
                </Typography>
                <Typography variant="caption" className="text-muted-foreground">
                  {formatRelativeTime(t.createdAt)}
                </Typography>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Typography variant="price-sm" className="text-foreground">
                  {formatNaira(t.amount - t.platformFee)}
                </Typography>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5",
                    STATUS_TINT[t.status]
                  )}
                >
                  <Typography variant="label-sm">{STATUS_LABEL[t.status]}</Typography>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
