"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Megaphone, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { getMyDiscoverCampaigns } from "@/lib/services/discover";
import { useSellerShopStore } from "@/store/sellerShopStore";
import type { DiscoverAdCampaign, DiscoverPost } from "@/types";
import { AdsListClient } from "./AdsListClient";

type CampaignWithPost = DiscoverAdCampaign & { post: DiscoverPost };

export function AdsPanel() {
  const shop = useSellerShopStore((s) => s.shop);
  const [campaigns, setCampaigns] = useState<CampaignWithPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!shop) return;
    let cancelled = false;
    getMyDiscoverCampaigns(shop.id)
      .then((c) => {
        if (cancelled) return;
        setCampaigns(c);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [shop]);

  if (!shop || !loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2
          aria-label="Loading ads"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  const totalSpend = campaigns.reduce((sum, c) => sum + c.amountPaid, 0);
  const totalImpressions = campaigns.reduce(
    (sum, c) => sum + c.post.impressions,
    0
  );
  const totalClicks = campaigns.reduce((sum, c) => sum + c.post.clicks, 0);
  const ctr =
    totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Typography variant="heading-h1">Discover ads</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Pay to put your video in front of buyers in the Discover feed.
          </Typography>
        </div>
        <Button asChild variant="cta" size="lg">
          <Link href="/seller/ads/new">
            <Plus className="size-4" />
            Create ad
          </Link>
        </Button>
      </header>

      {campaigns.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Total spend" value={`₦${totalSpend.toLocaleString("en-NG")}`} />
          <Stat label="Impressions" value={totalImpressions.toLocaleString("en-NG")} />
          <Stat
            label="Avg. CTR"
            value={`${ctr}%`}
            hint={`${totalClicks.toLocaleString("en-NG")} clicks`}
          />
        </div>
      )}

      {campaigns.length === 0 ? <EmptyState /> : <AdsListClient campaigns={campaigns} />}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
      <Typography variant="caption" className="text-muted-foreground">
        {label}
      </Typography>
      <Typography variant="heading-h3">{value}</Typography>
      {hint && (
        <Typography variant="caption" className="text-muted-foreground">
          {hint}
        </Typography>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <span
        aria-hidden
        className="grid size-14 place-items-center rounded-2xl bg-accent/15 text-accent"
      >
        <Megaphone className="size-6" />
      </span>
      <Typography variant="heading-h3">No ads running yet</Typography>
      <Typography variant="body-sm" className="max-w-md text-muted-foreground">
        Upload a short vertical video and put it in front of every buyer
        scrolling Discover. You&apos;ll see views and clicks update live.
      </Typography>
      <Button asChild variant="cta" size="lg" className="mt-2">
        <Link href="/seller/ads/new">
          <Plus className="size-4" />
          Create your first ad
        </Link>
      </Button>
    </div>
  );
}
