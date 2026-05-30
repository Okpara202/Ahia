import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, MousePointerClick, TrendingUp, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import { getDiscoverAdAnalytics } from "@/lib/services/discover";
import { AdAnalyticsChart } from "./_components/AdAnalyticsChart";
import { AdPreviewCard } from "./_components/AdPreviewCard";

interface AdAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdAnalyticsPageProps) {
  const { id } = await params;
  const data = await getDiscoverAdAnalytics(id);
  return {
    title: data
      ? `${data.post.caption ?? "Ad"} — Ahia Seller`
      : "Ad not found — Ahia Seller",
  };
}

export default async function AdAnalyticsPage({ params }: AdAnalyticsPageProps) {
  const { id } = await params;
  const data = await getDiscoverAdAnalytics(id);
  if (!data) notFound();

  const { campaign, post, daily } = data;
  // Server component renders at request time — clock read is intentional.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const endsTs = new Date(campaign.endsAt).getTime();
  const daysLeft = Math.max(0, Math.round((endsTs - now) / (1000 * 60 * 60 * 24)));
  const expired = endsTs < now;

  const ctr =
    post.impressions > 0
      ? ((post.clicks / post.impressions) * 100).toFixed(1)
      : "0.0";

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
            {expired ? "Ended" : `Running • ${daysLeft} days left`}
          </Typography>
          <Typography variant="heading-h1">
            {post.caption ?? "Untitled ad"}
          </Typography>
        </div>
        {!expired && (
          <Button variant="cta" size="lg">
            Extend campaign
          </Button>
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
              value={formatNaira(campaign.amountPaid)}
              icon={Wallet}
            />
          </div>
          <AdAnalyticsChart data={daily} />
        </div>
      </div>
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
