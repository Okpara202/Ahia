import Link from "next/link";
import { BadgeCheck, ArrowRight } from "lucide-react";

import { Typography } from "@/components/Typography";
import type { Shop } from "@/types";

export function ShopResult({ shop }: { shop: Shop }) {
  return (
    <Link
      href={`/shops/${shop.id}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <span
        aria-hidden
        className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
      >
        <Typography variant="heading-h3">
          {shop.name.charAt(0)}
        </Typography>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <Typography variant="heading-h4" className="truncate">
            {shop.name}
          </Typography>
          {shop.verified && (
            <BadgeCheck className="size-4 shrink-0 text-primary" />
          )}
        </div>
        <Typography variant="caption" className="text-muted-foreground">
          {shop.handle}
        </Typography>
        {shop.bio && (
          <Typography
            variant="body-sm"
            className="mt-1 line-clamp-2 text-muted-foreground"
          >
            {shop.bio}
          </Typography>
        )}
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
