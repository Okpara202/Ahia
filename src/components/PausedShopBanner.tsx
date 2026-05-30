import { PauseCircle } from "lucide-react";

import { Typography } from "@/components/Typography";

interface PausedShopBannerProps {
  /** Optional shop name — included in the message when present. */
  shopName?: string;
  /** Tight variant for product pages where the banner sits above content;
   *  default is the bigger storefront treatment. */
  compact?: boolean;
}

/**
 * Shown to buyers on `/shops/:id` and `/products/:id` when the target
 * shop has `isActive === false`. Pure informational — actionable affordances
 * (Follow button, disabled chat) live in the consuming surface so different
 * surfaces can place them where they fit best.
 *
 * Renders nothing on its own if the shop is active — callers can pass the
 * raw `shop.isActive` and let this component short-circuit:
 *
 *     {shop.isActive === false && <PausedShopBanner shopName={shop.name} />}
 */
export function PausedShopBanner({ shopName, compact }: PausedShopBannerProps) {
  const subject = shopName ? (
    <>
      <span className="font-semibold text-foreground">{shopName}</span> is on a
      break.
    </>
  ) : (
    <>This seller is on a break.</>
  );

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/8 ${
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5"
      }`}
    >
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-full bg-warning/15 text-warning ${
          compact ? "size-9" : "size-10"
        }`}
      >
        <PauseCircle className={compact ? "size-4" : "size-5"} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography variant="label-md">{subject}</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          They&apos;re not taking new orders right now. Follow to know when they
          reopen — existing buyers can keep chatting as normal.
        </Typography>
      </div>
    </div>
  );
}
