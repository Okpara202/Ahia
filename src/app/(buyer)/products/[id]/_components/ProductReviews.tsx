import { Star } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Review } from "@/types";

interface ProductReviewsProps {
  reviews: Review[];
  average: number;
  count: number;
}

export function ProductReviews({ reviews, average, count }: ProductReviewsProps) {
  if (count === 0) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card p-5">
        <Typography variant="heading-h4">No reviews yet</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Be the first to buy this and leave a star rating. Reviews come from
          real, completed transactions only — no spam.
        </Typography>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Typography variant="heading-h3">Reviews</Typography>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-accent">
          <Star className="size-3.5 fill-current" />
          <Typography variant="label-sm" className="font-semibold">
            {average.toFixed(1)}
          </Typography>
          <Typography variant="caption">
            ({count})
          </Typography>
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {reviews.slice(0, 5).map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary"
                >
                  <Typography variant="label-sm" className="font-semibold">
                    {r.authorName.charAt(0)}
                  </Typography>
                </span>
                <Typography variant="label-md">{r.authorName}</Typography>
              </div>
              <div
                className="flex items-center gap-0.5 text-accent"
                aria-label={`${r.rating} out of 5 stars`}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "size-3.5",
                      n <= r.rating ? "fill-current" : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>
            {r.body && (
              <Typography variant="body-sm" className="text-muted-foreground">
                {r.body}
              </Typography>
            )}
            <Typography variant="caption" className="text-muted-foreground">
              {formatRelativeTime(r.createdAt)}
            </Typography>
          </li>
        ))}
      </ul>

      {count > 5 && (
        <Typography variant="caption" className="text-muted-foreground">
          Showing 5 of {count}.
        </Typography>
      )}
    </section>
  );
}
