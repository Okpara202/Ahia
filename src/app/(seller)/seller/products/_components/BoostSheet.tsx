"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, X, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { buyBoost } from "@/lib/services/boosts";
import { BOOST_PLANS } from "@/lib/mocks/boosts";
import { formatNaira } from "@/lib/format";
import { toast } from "@/store/toastStore";
import type { BoostPlanId, Product } from "@/types";
import { BoostPlanList } from "./BoostPlanList";

interface BoostSheetProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function BoostSheet({ product, open, onClose }: BoostSheetProps) {
  const [planId, setPlanId] = useState<BoostPlanId>("quarterly");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const chosen = BOOST_PLANS.find((p) => p.id === planId) ?? BOOST_PLANS[0];
  const monthlyRef = BOOST_PLANS[0].priceNaira;
  const savings = chosen.months * monthlyRef - chosen.priceNaira;

  async function handlePay() {
    setSubmitting(true);
    try {
      const callbackUrl = `${window.location.origin}/payments/return`;
      const { authorizationUrl } = await buyBoost({
        productId: product.id,
        planId,
        callbackUrl,
      });
      window.location.href = authorizationUrl;
    } catch (err) {
      toast.fromApiError("Couldn't open Paystack", err);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative flex w-full max-w-md flex-col gap-5 rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-300 sm:rounded-3xl sm:p-6 sm:slide-in-from-bottom-4 sm:fade-in">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-accent/15 text-accent">
              <Zap className="size-4" />
            </span>
            <Typography variant="heading-h3">Boost product</Typography>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <Typography variant="body-sm" className="text-muted-foreground">
          Surface{" "}
          <span className="font-medium text-foreground">{product.name}</span>{" "}
          in Discover and at the top of the feed. Buyers see a small
          &ldquo;Sponsored&rdquo; tag.
        </Typography>
        <BoostPlanList planId={planId} onSelect={setPlanId} />
        {savings > 0 && (
          <Typography variant="caption" className="text-success">
            You save {formatNaira(savings)} vs monthly billing.
          </Typography>
        )}
        <Button
          onClick={handlePay}
          variant="cta"
          size="lg"
          disabled={submitting}
        >
          <ShieldCheck className="size-4" />
          {submitting
            ? "Opening Paystack…"
            : `Pay ${formatNaira(chosen.priceNaira)}`}
        </Button>
      </div>
    </div>
  );
}
