import Image from "next/image";

import { Typography } from "@/components/Typography";
import { formatNaira, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types";

interface TransactionRowProps {
  transaction: Transaction;
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

export function TransactionRow({ transaction }: TransactionRowProps) {
  const { product, amount, platformFee, status, createdAt } = transaction;
  const payout = amount - platformFee;

  const thumbUrl =
    product.media.type === "image"
      ? product.media.url
      : product.media.poster ?? "";

  return (
    <li className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-14">
        {thumbUrl && (
          <Image
            src={thumbUrl}
            alt={product.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography variant="label-md" className="line-clamp-1">
          {product.name}
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {formatRelativeTime(createdAt)} • Fee {formatNaira(platformFee)}
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
