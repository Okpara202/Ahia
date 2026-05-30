"use client";

import Link from "next/link";

import { Typography } from "@/components/Typography";
import { formatNaira, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types";

const STATUS_LABEL: Record<TransactionStatus, string> = {
  held: "In escrow",
  partial_released: "Partially released",
  fully_released: "Released to seller",
  partial_refunded: "Partially refunded",
  fully_refunded: "Refunded",
};

const STATUS_STYLES: Record<TransactionStatus, string> = {
  held: "bg-primary/15 text-primary",
  partial_released: "bg-primary/10 text-primary",
  fully_released: "bg-success/15 text-success",
  partial_refunded: "bg-accent/15 text-accent",
  fully_refunded: "bg-accent/15 text-accent",
};

/**
 * Chat v1: transactions are invoice-backed. Each row shows the invoice
 * total, status, and a short line summary. Per-line confirm/dispute UI
 * lives inside the chat thread on the invoice card (Phase 2).
 */
export function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { invoice, status, paidAt, seller, totalPaid } = transaction;
  const lineSummary =
    invoice.lines.length === 1
      ? invoice.lines[0].name
      : `${invoice.lines.length} items`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Typography variant="label-lg" className="line-clamp-1">
            {lineSummary}
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            from {seller.name}
          </Typography>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5",
                STATUS_STYLES[status]
              )}
            >
              <Typography variant="label-sm">{STATUS_LABEL[status]}</Typography>
            </span>
            <Typography variant="caption" className="text-muted-foreground">
              {formatRelativeTime(paidAt)}
            </Typography>
          </div>
        </div>

        <Typography
          variant="price-md"
          className="ml-auto shrink-0 text-foreground"
        >
          {formatNaira(Number(totalPaid))}
        </Typography>
      </div>

      {invoice.lines.length > 1 && (
        <ul className="flex flex-col gap-1 border-t border-border pt-3">
          {invoice.lines.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between gap-3 text-muted-foreground"
            >
              <Typography variant="body-sm" className="line-clamp-1">
                {l.name}
                {l.quantity > 1 && ` × ${l.quantity}`}
              </Typography>
              <Typography variant="caption">
                {formatNaira(Number(l.unitPrice) * l.quantity)} ·{" "}
                {l.status}
              </Typography>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-end">
        <Link
          href={`/inbox`}
          className="text-primary hover:underline"
        >
          <Typography variant="label-sm">Open chat to manage →</Typography>
        </Link>
      </div>
    </div>
  );
}
