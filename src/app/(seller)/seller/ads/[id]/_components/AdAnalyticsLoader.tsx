"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/PageLoader";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import {
  getDiscoverPostAnalytics,
  getDiscoverPostById,
} from "@/lib/services/discover";
import type {
  DailyAdStat,
  DiscoverAdCampaign,
  DiscoverPost,
} from "@/types";
import { AdAnalyticsChart } from "./AdAnalyticsChart";
import { AdPreviewCard } from "./AdPreviewCard";
import { BoostExistingPostButton } from "./BoostExistingPostButton";
import { EditPostControls } from "./EditPostControls";

interface AdAnalyticsLoaderProps {
  id: string;
}

interface LoadedData {
  post: DiscoverPost;
  campaign: DiscoverAdCampaign | null;
  daily: DailyAdStat[];
}

/**
 * Client-side loader for /seller/ads/[id]. Cross-origin SSR can't see the
 * session cookie (CLAUDE.md §11c), so the data fetch HAS to happen in the
 * browser — otherwise every authed call here 401s.
 */
export function AdAnalyticsLoader({ id }: AdAnalyticsLoaderProps) {
  const router = useRouter();
  const [data, setData] = useState<LoadedData | null>(null);
  const [error, setError] = useState<"not_found" | "other" | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const post = await getDiscoverPostById(id);
        if (cancelled) return;
        if (!post) {
          setError("not_found");
          return;
        }
        const sponsored =
          post.status === "boosted" ||
          (post.status === undefined && post.sponsored === true);
        const analytics = sponsored
          ? await getDiscoverPostAnalytics(id)
          : null;
        if (cancelled) return;
        setData({
          post,
          campaign: analytics?.campaign ?? null,
          daily: analytics?.daily ?? [],
        });
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("not_found");
        } else {
          console.warn("[ad-analytics-loader] failed", {
            id,
            apiErr: extractApiError(err),
            status: axios.isAxiosError(err) ? err.response?.status : undefined,
          });
          setError("other");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error === "not_found") {
    return (
      <ErrorState
        title="Post not found"
        body="This ad doesn't exist or you don't have access to it."
        onBack={() => router.replace("/seller/ads")}
      />
    );
  }

  if (error === "other") {
    return (
      <ErrorState
        title="Couldn't load this ad"
        body="Network or server hiccup. Refresh to try again."
        onBack={() => router.replace("/seller/ads")}
      />
    );
  }

  if (!data) {
    return <PageLoader fullScreen={false} label="Loading ad…" />;
  }

  return <Loaded {...data} />;
}

function Loaded({ post, campaign, daily }: LoadedData) {
  const now = Date.now();
  const expiresTs = post.expiresAt ? new Date(post.expiresAt).getTime() : null;
  const localExpired = expiresTs !== null && expiresTs < now;
  const lifecycle: "organic" | "boosted" | "expired" =
    post.status ??
    (localExpired ? "expired" : post.sponsored ? "boosted" : "organic");
  const sponsored = lifecycle === "boosted";
  const expired = lifecycle === "expired";
  const daysLeft =
    expiresTs !== null
      ? Math.max(0, Math.round((expiresTs - now) / (1000 * 60 * 60 * 24)))
      : null;

  const ctr =
    post.impressions > 0
      ? ((post.clicks / post.impressions) * 100).toFixed(1)
      : "0.0";

  const status = expired
    ? "Expired"
    : sponsored
      ? `Sponsored${daysLeft !== null ? ` · ${daysLeft}d left` : ""}`
      : `Organic${daysLeft !== null ? ` · ${daysLeft}d left` : ""}`;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Link
        href="/seller/ads"
        className="inline-flex w-fit items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <Typography variant="label-sm">All ads</Typography>
      </Link>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Typography variant="overline" className="text-muted-foreground">
            {status}
          </Typography>
          <Typography variant="heading-h1">
            {post.caption ?? "Untitled post"}
          </Typography>
        </div>
        {!sponsored && !expired && (
          <BoostExistingPostButton
            postId={post.id}
            views={post.impressions}
          />
        )}
        {expired && (
          <Link
            href="/seller/ads/new"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-accent-foreground transition-opacity hover:opacity-90"
          >
            <Zap className="size-4" />
            <Typography variant="label-md">Re-upload to relaunch</Typography>
          </Link>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <AdPreviewCard post={post} />
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Kpi
              label="Impressions"
              value={post.impressions.toLocaleString("en-NG")}
              icon={Eye}
            />
            <Kpi
              label="Clicks"
              value={post.clicks.toLocaleString("en-NG")}
              icon={MousePointerClick}
            />
            <Kpi label="CTR" value={`${ctr}%`} icon={TrendingUp} />
            <Kpi
              label="Spent"
              value={campaign ? formatNaira(campaign.amountPaid) : "—"}
              icon={Wallet}
            />
          </div>
          {sponsored && daily.length > 0 && <AdAnalyticsChart data={daily} />}
        </div>
      </div>

      {sponsored && (
        <EditPostControls
          postId={post.id}
          caption={post.caption ?? ""}
          editsRemaining={post.editsRemaining ?? 0}
        />
      )}
    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
  icon: typeof Eye;
}

function Kpi({ label, value, icon: Icon }: KpiProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Typography variant="caption" className="text-muted-foreground">
          {label}
        </Typography>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <Typography variant="heading-h2" className="text-foreground">
        {value}
      </Typography>
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  body: string;
  onBack: () => void;
}

function ErrorState({ title, body, onBack }: ErrorStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <Typography variant="heading-h2">{title}</Typography>
      <Typography variant="body-md" className="text-muted-foreground">
        {body}
      </Typography>
      <Button type="button" onClick={onBack} variant="outline" size="lg">
        <ArrowLeft className="size-4" />
        Back to ads
      </Button>
    </div>
  );
}
