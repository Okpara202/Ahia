"use client";

import { ArrowDownRight } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import type { PayoutRow } from "@/lib/services/payout";

interface PayoutHistoryListProps {
  payouts: PayoutRow[];
}

export function PayoutHistoryList({ payouts }: PayoutHistoryListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {payouts.map((p) => {
        const date = new Date(p.paidOutAt);
        const day = date.toLocaleDateString("en-NG", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        return (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/15 text-success"
            >
              <ArrowDownRight className="size-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <Typography variant="label-md">{day}</Typography>
              <Typography variant="caption" className="text-muted-foreground">
                {p.transactionIds.length}{" "}
                {p.transactionIds.length === 1 ? "sale" : "sales"} ·{" "}
                {isWeekend
                  ? "Landing Mon morning"
                  : "Landing today"}
              </Typography>
            </div>
            <Typography
              variant="price-md"
              className="shrink-0 font-mono tabular-nums"
            >
              {formatNaira(Number(p.amount))}
            </Typography>
          </li>
        );
      })}
    </ul>
  );
}
