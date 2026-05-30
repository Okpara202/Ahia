"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { submitReview } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import type { Transaction } from "@/types";

interface RateRecentPurchaseProps {
  transaction: Transaction;
}

export function RateRecentPurchase({ transaction }: RateRecentPurchaseProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      await submitReview({
        transactionId: transaction.id,
        productId: transaction.product.id,
        shopId: transaction.shop.id,
        rating,
        body,
      });
      setSubmitted(true);
      toast.success("Thanks for the review", "It helps other buyers trust this seller.");
      router.refresh();
    } catch {
      toast.error("Couldn't submit", "Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  const thumbUrl =
    transaction.product.media.type === "image"
      ? transaction.product.media.url
      : transaction.product.media.poster ?? "";

  if (submitted) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-4">
        <span className="grid size-9 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <Typography variant="body-sm" className="text-success">
          Thanks — your review is live on the product page.
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          {thumbUrl && (
            <Image
              src={thumbUrl}
              alt={transaction.product.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Typography variant="label-md">Rate your purchase</Typography>
          <Typography variant="caption" className="line-clamp-1 text-muted-foreground">
            {transaction.product.name} from {transaction.shop.name}
          </Typography>
        </div>
      </div>

      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Rating"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
          >
            <Star
              className={cn(
                "size-5 transition-colors",
                n <= rating && "fill-accent text-accent"
              )}
            />
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Tell other buyers what to expect (optional)"
        maxLength={280}
        rows={2}
        className="w-full resize-none rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />

      <div>
        <Button
          type="button"
          variant="cta"
          size="lg"
          onClick={handleSubmit}
          disabled={rating < 1 || submitting}
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Posting…" : "Post review"}
        </Button>
      </div>
    </div>
  );
}
