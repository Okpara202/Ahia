"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Megaphone, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { getMyDiscoverPosts } from "@/lib/services/discover";
import { useSellerShopStore } from "@/store/sellerShopStore";
import type { DiscoverPost } from "@/types";
import { AdsListClient } from "./AdsListClient";

/**
 * Discover v2: this list now shows ALL the seller's posts — free
 * (organic), boosted (paid), and expired — not just paid campaigns.
 * Drives a single inbox-style list where each row's visual state tells
 * the seller what's happening with that post.
 */
export function AdsPanel() {
  const shop = useSellerShopStore((s) => s.shop);
  const [posts, setPosts] = useState<DiscoverPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!shop) return;
    let cancelled = false;
    getMyDiscoverPosts({ limit: 50 })
      .then((page) => {
        if (cancelled) return;
        setPosts(page.items);
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
          aria-label="Loading posts"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = posts.reduce((sum, p) => sum + p.clicks, 0);
  const sponsoredCount = posts.filter((p) => p.sponsored).length;
  const ctr =
    totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Typography variant="heading-h1">Discover posts</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Post videos to Discover. Free for 30 days; boost any to surface
            into priority slots.
          </Typography>
        </div>
        <Button asChild variant="cta" size="lg">
          <Link href="/seller/ads/new">
            <Plus className="size-4" />
            New post
          </Link>
        </Button>
      </header>

      {posts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Posts"
            value={posts.length.toString()}
            hint={`${sponsoredCount} boosted`}
          />
          <Stat
            label="Impressions"
            value={totalImpressions.toLocaleString("en-NG")}
          />
          <Stat
            label="Avg. CTR"
            value={`${ctr}%`}
            hint={`${totalClicks.toLocaleString("en-NG")} clicks`}
          />
        </div>
      )}

      {posts.length === 0 ? <EmptyState /> : <AdsListClient posts={posts} />}
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
      <Typography variant="heading-h3">No Discover posts yet</Typography>
      <Typography variant="body-sm" className="max-w-md text-muted-foreground">
        Upload a short vertical video to Discover — free for 30 days, or
        pay to boost into priority slots. Views and clicks update live.
      </Typography>
      <Button asChild variant="cta" size="lg" className="mt-2">
        <Link href="/seller/ads/new">
          <Plus className="size-4" />
          Create your first post
        </Link>
      </Button>
    </div>
  );
}
