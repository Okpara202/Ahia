"use client";

import { useEffect, useState } from "react";
import { Loader2, Zap } from "lucide-react";

import { BoostPlanList } from "@/app/(seller)/seller/products/_components/BoostPlanList";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { BOOST_PLANS } from "@/lib/mocks/boosts";
import { purchaseDiscoverCampaign } from "@/lib/services/discover";
import { toast } from "@/store/toastStore";
import type { BoostPlanId } from "@/types";

interface BoostExistingPostButtonProps {
  postId: string;
  views: number;
}

/**
 * Boost-later CTA for an organic Discover post. Opens a sheet with the
 * plan picker, then hands off to Paystack via `purchaseDiscoverCampaign`
 * — same primitive as the upload-and-boost path, just keyed off an
 * existing postId.
 *
 * Live view count is surfaced in the trigger button copy to make the
 * value prop concrete ("200 views so far → boost to get 5×").
 */
export function BoostExistingPostButton({
  postId,
  views,
}: BoostExistingPostButtonProps) {
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState<BoostPlanId>("monthly");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Reset the "Opening Paystack…" spinner if the seller hits back after a
  // Paystack decline / cancel. handlePay navigates away via
  // window.location.href, so it never gets to clear `submitting` itself —
  // and on bfcache restore React preserves state without re-running
  // effects. Without this, the button is stuck spinning until a full
  // reload. `event.persisted === true` is the bfcache signal.
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted && submitting) {
        setSubmitting(false);
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [submitting]);

  const chosen = BOOST_PLANS.find((p) => p.id === planId) ?? BOOST_PLANS[0];

  async function handlePay() {
    setSubmitting(true);
    try {
      const callbackUrl = `${window.location.origin}/payments/return`;
      const idempotencyKey = crypto.randomUUID();
      const { authorizationUrl } = await purchaseDiscoverCampaign({
        postId,
        planId,
        callbackUrl,
        idempotencyKey,
      });
      window.location.href = authorizationUrl;
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr?.code === "duplicate_request") {
        toast.info(
          "Boost already in progress",
          "We received your earlier request. If Paystack doesn't open, refresh and try again.",
          apiErr.requestId
        );
      } else {
        toast.fromApiError("Couldn't open Paystack", err);
      }
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="cta"
        size="lg"
        onClick={() => setOpen(true)}
      >
        <Zap className="size-4" />
        {views > 0 ? `Boost — ${views} views so far` : "Boost this post"}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="relative flex w-full max-w-md flex-col gap-5 rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-300 sm:rounded-3xl sm:p-6 sm:slide-in-from-bottom-4 sm:fade-in">
            <header className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-accent/15 text-accent">
                <Zap className="size-4" />
              </span>
              <Typography variant="heading-h3">Boost this post</Typography>
            </header>

            <Typography variant="body-sm" className="text-muted-foreground">
              Your post moves into Discover&apos;s priority slots for the
              full plan duration. Clock resets — the 30-day organic timer is
              replaced by the boost length.
            </Typography>

            <BoostPlanList planId={planId} onSelect={setPlanId} />

            <Button
              onClick={handlePay}
              variant="cta"
              size="lg"
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting
                ? "Opening Paystack…"
                : `Pay ${formatNaira(chosen.priceNaira)} & boost`}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
