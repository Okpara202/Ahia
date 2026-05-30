"use client";

import { useState } from "react";
import { Check, HandCoins, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import {
  respondToOffer,
  sendOffer,
} from "@/lib/services/conversations";
import { startCheckout } from "@/lib/services/transactions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { toast } from "@/store/toastStore";
import type { Message, OfferMessage, OfferStatus } from "@/types";

interface OfferCardProps {
  message: OfferMessage;
  /** True when the current viewer received this offer (can accept/counter/decline). */
  canRespond: boolean;
  /** Product the conversation is about — used by the buyer's Pay button on
   *  an accepted offer. */
  productId: string;
}

const STATUS_TEXT: Record<OfferStatus, string> = {
  pending: "Offer sent",
  accepted: "Offer accepted",
  declined: "Offer declined",
  countered: "Countered",
};

const STATUS_TINT: Record<OfferStatus, string> = {
  pending: "bg-accent/15 text-accent",
  accepted: "bg-success/15 text-success",
  declined: "bg-muted text-muted-foreground",
  countered: "bg-muted text-muted-foreground",
};

export function OfferCard({ message, canRespond, productId }: OfferCardProps) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const replaceMessage = useChatStore((s) => s.replaceMessage);
  const addMessage = useChatStore((s) => s.addMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterValue, setCounterValue] = useState("");
  const [working, setWorking] = useState(false);
  const [paying, setPaying] = useState(false);

  // The buyer is the one who sent this offer — `canRespond` is true for the
  // seller (the recipient). After acceptance, only the buyer should see Pay.
  const viewerIsBuyer = !canRespond;

  async function respond(status: "accepted" | "declined") {
    setWorking(true);
    const previous = message.status;
    // Optimistic: flip the badge immediately.
    replaceMessage(message.conversationId, message.id, { ...message, status });
    try {
      const updated = await respondToOffer(
        message.conversationId,
        message.id,
        status
      );
      replaceMessage(message.conversationId, message.id, updated);
    } catch (err) {
      // Roll back the optimistic update if the server rejects.
      replaceMessage(message.conversationId, message.id, {
        ...message,
        status: previous,
      });
      toast.error(
        "Couldn't update offer",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    } finally {
      setWorking(false);
    }
  }

  function handleAccept() {
    void respond("accepted");
  }

  function handleDecline() {
    void respond("declined");
  }

  async function handlePay() {
    setPaying(true);
    try {
      const { authorization_url } = await startCheckout(productId);
      window.location.href = authorization_url;
    } catch (err) {
      toast.error(
        "Couldn't open Paystack",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
      setPaying(false);
    }
  }

  async function handleSendCounter() {
    const amount = Number(counterValue.replace(/[^0-9]/g, ""));
    if (!amount) return;
    const note = `Counter to ${formatNaira(message.amount)}`;
    setCounterOpen(false);
    setCounterValue("");

    const tempId = `m_offer_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId: message.conversationId,
      senderId: currentUserId,
      type: "offer",
      amount,
      status: "pending",
      note,
      createdAt: new Date().toISOString(),
    };
    // Flip the original to "countered" optimistically and add the counter.
    replaceMessage(message.conversationId, message.id, {
      ...message,
      status: "countered" as OfferStatus,
    });
    addMessage(optimistic);
    try {
      const persisted = await sendOffer(message.conversationId, amount, note);
      replaceMessage(message.conversationId, tempId, persisted);
    } catch (err) {
      removeMessage(message.conversationId, tempId);
      replaceMessage(message.conversationId, message.id, message);
      toast.error(
        "Couldn't send counter",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-accent/[0.08] px-4 py-2.5 text-accent">
          <HandCoins className="size-4" />
          <Typography variant="label-md">Offer</Typography>
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
            <Typography variant="body-sm" className="text-muted-foreground">
              {message.note}
            </Typography>
          )}

          <span
            className={cn(
              "inline-flex items-center self-start rounded-full px-2.5 py-1",
              STATUS_TINT[message.status]
            )}
          >
            <Typography variant="label-sm">
              {STATUS_TEXT[message.status]}
            </Typography>
          </span>

          {viewerIsBuyer && message.status === "accepted" && (
            <Button
              onClick={handlePay}
              variant="cta"
              size="lg"
              className="mt-1 w-full"
              disabled={paying}
            >
              <ShieldCheck className="size-4" />
              {paying
                ? "Opening Paystack…"
                : `Pay ${formatNaira(message.amount)}`}
            </Button>
          )}

          {canRespond && message.status === "pending" && !counterOpen && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                onClick={handleAccept}
                variant="success"
                size="default"
                disabled={working}
              >
                <Check className="size-4" /> Accept
              </Button>
              <Button
                onClick={() => setCounterOpen(true)}
                variant="outline"
                size="default"
                disabled={working}
              >
                Counter
              </Button>
              <Button
                onClick={handleDecline}
                variant="outline"
                size="default"
                disabled={working}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="size-4" /> Decline
              </Button>
            </div>
          )}

          {counterOpen && (
            <div className="flex flex-col gap-2 pt-1">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Your counter price"
                value={counterValue}
                onChange={(e) => setCounterValue(e.target.value)}
                rightAdornment={
                  <Typography variant="label-sm" className="pr-2">
                    ₦
                  </Typography>
                }
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSendCounter}
                  variant="cta"
                  size="default"
                  disabled={!counterValue.trim()}
                  className="flex-1"
                >
                  Send counter
                </Button>
                <Button
                  onClick={() => setCounterOpen(false)}
                  variant="outline"
                  size="default"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
