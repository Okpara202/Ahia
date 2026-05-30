"use client";

import { Check, ShieldCheck } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentRequestMessage, PaymentRequestStatus } from "@/types";

interface PaymentRequestCardProps {
  message: PaymentRequestMessage;
}

const STATUS_TEXT: Record<PaymentRequestStatus, string> = {
  pending: "Payment requested",
  paid: "Payment held in escrow",
  cancelled: "Payment cancelled",
};

const STATUS_TINT: Record<PaymentRequestStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground",
  paid: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
};

/**
 * Display-only card for legacy `payment_request` messages. The v1 backend
 * doesn't emit these — buyer pays via the offer/accept flow, then hits
 * the "Pay" button on the accepted offer card. Kept so old threads still
 * render cleanly.
 */
export function PaymentRequestCard({ message }: PaymentRequestCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-primary/6 px-4 py-2.5 text-primary">
          <ShieldCheck className="size-4" />
          <Typography variant="label-md">Ahia payment request</Typography>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <Typography variant="caption" className="text-muted-foreground">
              Amount
            </Typography>
            <Typography variant="price-lg" className="text-foreground">
              {formatNaira(message.amount)}
            </Typography>
          </div>

          {message.note && (
            <div className="flex flex-col gap-1">
              <Typography variant="caption" className="text-muted-foreground">
                For
              </Typography>
              <Typography variant="body-sm">{message.note}</Typography>
            </div>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1",
              STATUS_TINT[message.status]
            )}
          >
            {message.status === "paid" && (
              <Check className="size-3" strokeWidth={3} />
            )}
            <Typography variant="label-sm">
              {STATUS_TEXT[message.status]}
            </Typography>
          </span>
        </div>
      </div>
    </div>
  );
}
