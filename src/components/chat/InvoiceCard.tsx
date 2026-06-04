"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  Hourglass,
  Loader2,
  Lock,
  ShieldAlert,
  Timer,
  XCircle,
} from "lucide-react";

import { Typography } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import {
  cancelInvoice,
  confirmInvoiceLine,
  payInvoice,
} from "@/lib/services/conversations";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";
import { toast } from "@/store/toastStore";
import type { Invoice, InvoiceLine, InvoiceStatus, Message } from "@/types";
import { DisputeLineDialog } from "./DisputeLineDialog";
import { ExtendLineDialog } from "./ExtendLineDialog";

interface InvoiceCardProps {
  message: Message & { type: "invoice" };
  /** True when the signed-in user is the buyer in this conversation. */
  isBuyer: boolean;
  /** True when the signed-in user sent this invoice (i.e. seller). */
  mine: boolean;
}

function formatNaira(amount: string | number): string {
  return `₦${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function lineTotal(line: InvoiceLine): string {
  const total = Number(line.unitPrice) * line.quantity;
  return formatNaira(total.toFixed(2));
}

function isResolvable(invoice: Invoice): boolean {
  return (
    invoice.status === "paid" ||
    invoice.status === "partial_released" ||
    invoice.status === "partial_refunded"
  );
}

/** A pending line whose autoReleaseAt has been cleared = open dispute. */
function isDisputed(line: InvoiceLine): boolean {
  return line.status === "pending" && line.autoReleaseAt === null;
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid · funds in escrow",
  partial_released: "Partially released",
  fully_released: "All released",
  partial_refunded: "Partial refund",
  fully_refunded: "Refunded",
  cancelled: "Cancelled",
  disputed: "Under review",
};

const STATUS_TONE: Record<
  InvoiceStatus,
  "neutral" | "warning" | "success" | "danger"
> = {
  pending: "warning",
  paid: "neutral",
  partial_released: "neutral",
  fully_released: "success",
  partial_refunded: "warning",
  fully_refunded: "warning",
  cancelled: "danger",
  disputed: "danger",
};

export function InvoiceCard({ message, isBuyer, mine }: InvoiceCardProps) {
  const { invoice } = message;
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resolvingLineId, setResolvingLineId] = useState<string | null>(null);
  const [disputeLine, setDisputeLine] = useState<InvoiceLine | null>(null);
  const [extendLine, setExtendLine] = useState<InvoiceLine | null>(null);
  const replaceMessage = useChatStore((s) => s.replaceMessage);

  async function handlePay() {
    if (paying) return;
    setPaying(true);
    try {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/payments/return`
          : undefined;
      const { authorizationUrl } = await payInvoice(invoice.id, callbackUrl);
      window.location.href = authorizationUrl;
    } catch (err) {
      setPaying(false);
      toast.fromApiError("Couldn't start payment", err);
    }
  }

  // Reset the "Paying…" spinner when the user returns to this page via the
  // browser back button after a Paystack decline/cancel. The pay handler
  // navigates away via `window.location.href`, so it never gets to clear
  // `paying` itself — and on bfcache restore React preserves state without
  // re-running effects. Without this, the Pay button is stuck spinning
  // until a full reload. `event.persisted === true` is the bfcache signal.
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted && paying) {
        setPaying(false);
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [paying]);

  async function handleCancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      const updated = await cancelInvoice(invoice.id);
      replaceMessage(message.conversationId, message.id, {
        ...message,
        invoice: updated,
      });
      toast.success("Invoice cancelled", "");
    } catch (err) {
      toast.fromApiError("Couldn't cancel", err);
    } finally {
      setCancelling(false);
    }
  }

  async function handleConfirm(line: InvoiceLine) {
    if (resolvingLineId) return;
    setResolvingLineId(line.id);
    try {
      const { invoice: updated } = await confirmInvoiceLine(line.id);
      replaceMessage(message.conversationId, message.id, {
        ...message,
        invoice: updated,
      });
      toast.confirm(
        "Released to seller",
        `Funds for "${line.name}" are on their way.`
      );
    } catch (err) {
      toast.fromApiError("Couldn't release", err);
    } finally {
      setResolvingLineId(null);
    }
  }

  /** Dispute returns just `{ line, dispute }` — no updated invoice. The
   *  invoice as a whole is unchanged; only this specific line's
   *  autoReleaseAt is cleared. Merge the updated line in-place. */
  function applyDisputedLine(updatedLine: InvoiceLine) {
    replaceMessage(message.conversationId, message.id, {
      ...message,
      invoice: {
        ...invoice,
        lines: invoice.lines.map((l) =>
          l.id === updatedLine.id ? updatedLine : l
        ),
      },
    });
    setDisputeLine(null);
  }

  /** Extension returns `{ line }` with fresh autoReleaseAt + extendedAt +
   *  reason. Merge the updated line in-place. */
  function applyExtendedLine(updatedLine: InvoiceLine) {
    replaceMessage(message.conversationId, message.id, {
      ...message,
      invoice: {
        ...invoice,
        lines: invoice.lines.map((l) =>
          l.id === updatedLine.id ? updatedLine : l
        ),
      },
    });
    setExtendLine(null);
  }

  const statusTone = STATUS_TONE[invoice.status];
  const total = formatNaira(invoice.totalAmount);
  const hasOpenDispute = invoice.lines.some(isDisputed);

  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        {/* Header strip */}
        <header className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-4" />
            </span>
            <div className="flex flex-col">
              <Typography variant="label-sm" className="text-muted-foreground">
                Invoice
              </Typography>
              <Typography
                variant="heading-h3"
                className="font-mono tabular-nums"
              >
                {total}
              </Typography>
            </div>
          </div>
          <StatusBadge tone={statusTone} label={STATUS_LABEL[invoice.status]} />
        </header>

        {/* Lines */}
        <ul className="flex flex-col divide-y divide-border">
          {invoice.lines.map((line) => {
            // Discounts are a price reduction, not goods — nothing for the
            // buyer to confirm or dispute. They're shown as "Applied" once
            // the invoice is paid, and skip the action row entirely.
            const canResolve =
              isBuyer &&
              isResolvable(invoice) &&
              line.status === "pending" &&
              !isDisputed(line) &&
              line.kind !== "discount";
            const canExtend =
              canResolve && line.kind !== "discount" && !line.extendedAt;
            return (
              <LineItem
                key={line.id}
                line={line}
                isBuyer={isBuyer}
                canResolve={canResolve}
                canExtend={canExtend}
                resolving={resolvingLineId === line.id}
                onConfirm={() => handleConfirm(line)}
                onDispute={() => setDisputeLine(line)}
                onExtend={() => setExtendLine(line)}
              />
            );
          })}
        </ul>

        {/* Footer — pending payment OR informational banner for disputes */}
        {invoice.status === "pending" && (
          <div className="flex flex-col gap-2 border-t border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="size-3.5" />
              <Typography variant="caption">
                {isBuyer
                  ? "Your money is held safely. You'll have 7 days after delivery to confirm — or ask for more time."
                  : "Buyer pays into escrow. Funds release when they confirm each line."}
              </Typography>
            </div>
            {isBuyer ? (
              <Button
                onClick={handlePay}
                variant="cta"
                size="lg"
                disabled={paying}
              >
                {paying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Opening Paystack…
                  </>
                ) : (
                  <>
                    <CircleDollarSign className="size-4" />
                    Pay {total}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Cancel invoice"}
              </Button>
            )}
          </div>
        )}

        {hasOpenDispute && invoice.status !== "pending" && (
          <div className="flex items-start gap-2 border-t border-border bg-destructive/5 px-4 py-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            <Typography variant="caption" className="text-muted-foreground">
              One line is under review. Other lines can still be confirmed
              independently.
            </Typography>
          </div>
        )}

        {disputeLine && (
          <DisputeLineDialog
            lineId={disputeLine.id}
            lineName={disputeLine.name}
            onClose={() => setDisputeLine(null)}
            onSubmitted={applyDisputedLine}
          />
        )}

        {extendLine && (
          <ExtendLineDialog
            lineId={extendLine.id}
            lineName={extendLine.name}
            onClose={() => setExtendLine(null)}
            onSubmitted={applyExtendedLine}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

interface LineItemProps {
  line: InvoiceLine;
  isBuyer: boolean;
  canResolve: boolean;
  canExtend: boolean;
  resolving: boolean;
  onConfirm: () => void;
  onDispute: () => void;
  onExtend: () => void;
}

function LineItem({
  line,
  isBuyer,
  canResolve,
  canExtend,
  resolving,
  onConfirm,
  onDispute,
  onExtend,
}: LineItemProps) {
  const isDiscount = line.kind === "discount";
  const disputed = isDisputed(line);
  const extended = line.extendedAt !== null;
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <Typography
            variant="label-md"
            className={cn("line-clamp-2", isDiscount && "text-accent")}
          >
            {line.name}
          </Typography>
          <Typography
            variant="caption"
            className="font-mono tabular-nums text-muted-foreground"
          >
            {line.quantity > 1
              ? `${formatNaira(line.unitPrice)} × ${line.quantity}`
              : isDiscount
              ? "Discount"
              : line.kind === "custom"
              ? "Custom line"
              : "Product"}
          </Typography>
        </div>
        <Typography
          variant="label-md"
          className={cn(
            "shrink-0 font-mono tabular-nums",
            isDiscount && "text-accent"
          )}
        >
          {lineTotal(line)}
        </Typography>
      </div>

      {isDiscount ? (
        // Discount is a price reduction — already "applied" the moment the
        // invoice was paid. Nothing for either party to act on per line.
        <LineBadge tone="muted" icon={<CheckCircle2 className="size-3" />}>
          Applied to total
        </LineBadge>
      ) : disputed ? (
        <LineBadge tone="danger" icon={<ShieldAlert className="size-3" />}>
          Under review · funds held
        </LineBadge>
      ) : line.status === "released" ? (
        <LineBadge tone="success" icon={<CheckCircle2 className="size-3" />}>
          Released to seller
        </LineBadge>
      ) : line.status === "refunded" ? (
        <LineBadge tone="accent" icon={<XCircle className="size-3" />}>
          Refunded
        </LineBadge>
      ) : !isDiscount && line.autoReleaseAt ? (
        extended ? (
          <div className="flex flex-col gap-0.5">
            <LineBadge tone="muted" icon={<Timer className="size-3" />}>
              {isBuyer ? "Extended" : "Buyer extended"} · auto-releases{" "}
              {formatAutoRelease(line.autoReleaseAt)}
            </LineBadge>
            {line.extensionReason && (
              <Typography
                variant="caption"
                className="pl-1 italic text-muted-foreground"
              >
                {isBuyer ? "Your note" : "They said"}:{" "}
                &ldquo;{line.extensionReason}&rdquo;
              </Typography>
            )}
          </div>
        ) : (
          <LineBadge tone="muted" icon={<Hourglass className="size-3" />}>
            Auto-releases {formatAutoRelease(line.autoReleaseAt)}
          </LineBadge>
        )
      ) : null}

      {canResolve && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              onClick={onConfirm}
              variant="default"
              size="sm"
              className="flex-1"
              disabled={resolving}
            >
              {resolving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              Confirm
            </Button>
            <Button
              onClick={onDispute}
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={resolving}
            >
              <AlertTriangle className="size-3.5" />
              Dispute
            </Button>
          </div>
          {canExtend && (
            <button
              type="button"
              onClick={onExtend}
              disabled={resolving}
              className="inline-flex w-fit items-center gap-1.5 self-start text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
            >
              <Clock className="size-3.5" />
              <Typography variant="caption">Need more time?</Typography>
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function formatAutoRelease(iso: string): string {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diffHours = (target - now) / (1000 * 60 * 60);
  if (diffHours < 1) return "soon";
  if (diffHours < 24) return `in ~${Math.round(diffHours)}h`;
  const days = Math.round(diffHours / 24);
  return `in ${days}d`;
}

interface LineBadgeProps {
  tone: "muted" | "success" | "accent" | "danger";
  icon: React.ReactNode;
  children: React.ReactNode;
}

function LineBadge({ tone, icon, children }: LineBadgeProps) {
  const classes =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "accent"
      ? "bg-accent/10 text-accent"
      : tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5",
        classes
      )}
    >
      {icon}
      <Typography variant="caption">{children}</Typography>
    </div>
  );
}

interface StatusBadgeProps {
  tone: "neutral" | "warning" | "success" | "danger";
  label: string;
}

function StatusBadge({ tone, label }: StatusBadgeProps) {
  const classes =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
      ? "bg-accent/15 text-accent"
      : tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : "bg-primary/10 text-primary";
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "warning"
      ? Clock
      : tone === "danger"
      ? ShieldAlert
      : CircleDollarSign;
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-2.5 py-1",
        classes
      )}
    >
      <Icon className="size-3" />
      <Typography variant="caption">{label}</Typography>
    </div>
  );
}
