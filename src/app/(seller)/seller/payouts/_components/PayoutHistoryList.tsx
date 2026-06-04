"use client";

import { ArrowDownRight, Loader2, XCircle, Zap } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PayoutRow } from "@/lib/services/payout";

interface PayoutHistoryListProps {
  payouts: PayoutRow[];
}

export function PayoutHistoryList({ payouts }: PayoutHistoryListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {payouts.map((p) => (
        <PayoutHistoryRow key={p.id} payout={p} />
      ))}
    </ul>
  );
}

function PayoutHistoryRow({ payout }: { payout: PayoutRow }) {
  const isCashOut = payout.kind === "cash_out_now";
  const date = new Date(payout.paidAt ?? payout.createdAt);
  const dayLabel = date.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const { icon, tint, label } = statusVisual(payout.status, isCashOut);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <span
        aria-hidden
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          tint
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Typography variant="label-md">{dayLabel}</Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {label} · {payout.invoiceLineIds.length}{" "}
          {payout.invoiceLineIds.length === 1 ? "line" : "lines"}
        </Typography>
      </div>
      <Typography
        variant="price-md"
        className="shrink-0 font-mono tabular-nums"
      >
        {formatNaira(Number(payout.amount))}
      </Typography>
    </li>
  );
}

function statusVisual(
  status: PayoutRow["status"],
  isCashOut: boolean
): { icon: React.ReactNode; tint: string; label: string } {
  if (status === "failed") {
    return {
      icon: <XCircle className="size-4" />,
      tint: "bg-destructive/15 text-destructive",
      label: "Payout failed — restored to your balance",
    };
  }
  if (status === "pending") {
    return {
      icon: <Loader2 className="size-4 animate-spin" />,
      tint: "bg-muted text-muted-foreground",
      label: isCashOut ? "Cash out queued" : "Daily sweep queued",
    };
  }
  return {
    icon: isCashOut ? (
      <Zap className="size-4" />
    ) : (
      <ArrowDownRight className="size-4" />
    ),
    tint: "bg-success/15 text-success",
    label: isCashOut ? "Cash out" : "Daily sweep",
  };
}
