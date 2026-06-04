"use client";

import Link from "next/link";
import { BadgeCheck, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { useSellerShopStore } from "@/store/sellerShopStore";
import { DeleteShopButton } from "./DeleteShopButton";
import { PayoutAccountSection } from "./PayoutAccountSection";
import { ShopForm } from "./ShopForm";

export function ShopSettings() {
  const shop = useSellerShopStore((s) => s.shop);

  if (!shop) {
    // SellerShellGate would normally show the create-shop fallback before we
    // get here. If shop is still null on this page it means we're between
    // fetches — show a spinner rather than crashing on `shop.name`.
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2
          aria-label="Loading shop"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-1">
        <Typography variant="heading-h1">Shop settings</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          How your shop appears to buyers in the feed and on your storefront.
        </Typography>
      </header>

      <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:size-20"
        >
          <Typography variant="display-md">{shop.name.charAt(0)}</Typography>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Typography variant="heading-h3" className="truncate">
              {shop.name}
            </Typography>
            {shop.verified && (
              <BadgeCheck className="size-4 shrink-0 text-primary" />
            )}
          </div>
          <Typography variant="caption" className="text-muted-foreground">
            {shop.handle}
            {shop.totalSales !== undefined && (
              <> • {shop.totalSales} sales</>
            )}
          </Typography>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/shops/${shop.id}`} target="_blank">
            View public
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      </section>

      <ShopForm shop={shop} />

      <PayoutAccountSection />

      <section className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/3 p-5">
        <Typography variant="heading-h4">Delete my shop</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Step away from selling — temporarily or permanently. The next
          screen lets you pick what fits.
        </Typography>
        <div>
          <DeleteShopButton />
        </div>
      </section>
    </div>
  );
}
