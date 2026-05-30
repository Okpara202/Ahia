import { Typography } from "@/components/Typography";
import { formatNaira, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types";

interface TransactionRowProps {
  transaction: Transaction;
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

export function TransactionRow({ transaction }: TransactionRowProps) {
  const { invoice, totalPaid, platformFee, status, paidAt, buyer } = transaction;
  const payout = Number(totalPaid) - Number(platformFee);
  const lineSummary =
    invoice.lines.length === 1
      ? invoice.lines[0].name
      : `${invoice.lines.length} items`;

  return (
    <li className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography variant="label-md" className="line-clamp-1">
          {lineSummary}
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {buyer.name} · {formatRelativeTime(paidAt)} · Fee{" "}
          {formatNaira(Number(platformFee))}
        </Typography>
      </div>

      <div className="flex flex-col items-end gap-1">
        <Typography variant="price-md" className="text-foreground">
          {formatNaira(payout)}
        </Typography>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5",
            STATUS_TINT[status]
          )}
        >
          <Typography variant="label-sm">{STATUS_LABEL[status]}</Typography>
        </span>
      </div>
    </li>
  );
}
