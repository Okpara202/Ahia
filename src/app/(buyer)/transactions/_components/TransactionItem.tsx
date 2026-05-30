"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { formatNaira, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types";
import { RaiseDisputeDialog } from "./RaiseDisputeDialog";

const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: "Awaiting payment",
  held: "Held in escrow",
  released: "Released to seller",
  refunded: "Refunded",
  cancelled: "Cancelled",
  disputed: "Disputed",
  resolved_buyer: "Refunded after dispute",
  resolved_seller: "Released after dispute",
};

const STATUS_STYLES: Record<TransactionStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  held: "bg-primary/15 text-primary",
  released: "bg-success/15 text-success",
  refunded: "bg-accent/15 text-accent",
  cancelled: "bg-muted text-muted-foreground",
  disputed: "bg-destructive/15 text-destructive",
  resolved_buyer: "bg-accent/15 text-accent",
  resolved_seller: "bg-success/15 text-success",
};

export function TransactionItem({ transaction }: { transaction: Transaction }) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const { product, shop, amount, status, createdAt } = transaction;
  const canDispute = status === "held";

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            {product.media.type === "image" ? (
              <Image
                src={product.media.url}
                alt={product.media.alt ?? product.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <Image
                src={product.media.poster ?? ""}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Link href={`/products/${product.id}`} className="block">
              <Typography variant="label-lg" className="line-clamp-1">
                {product.name}
              </Typography>
            </Link>
            <Link
              href={`/shops/${shop.id}`}
              className="block text-muted-foreground hover:text-foreground"
            >
              <Typography variant="caption">{shop.handle}</Typography>
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5",
                  STATUS_STYLES[status]
                )}
              >
                <Typography variant="label-sm">
                  {STATUS_LABEL[status]}
                </Typography>
              </span>
              <Typography variant="caption" className="text-muted-foreground">
                {formatRelativeTime(createdAt)}
              </Typography>
            </div>
          </div>

          <Typography
            variant="price-md"
            className="ml-auto shrink-0 text-foreground"
          >
            {formatNaira(amount)}
          </Typography>
        </div>

        {canDispute && (
          <div className="flex items-center justify-end border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setDisputeOpen(true)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <ShieldAlert className="size-4" />
              Raise dispute
            </Button>
          </div>
        )}
      </div>

      {canDispute && (
        <RaiseDisputeDialog
          transaction={transaction}
          open={disputeOpen}
          onOpenChange={setDisputeOpen}
        />
      )}
    </>
  );
}
