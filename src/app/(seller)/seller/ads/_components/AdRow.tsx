import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, MousePointerClick, Zap } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira, formatRelativeTime } from "@/lib/format";
import type { DiscoverAdCampaign, DiscoverPost } from "@/types";

interface AdRowProps {
  campaign: DiscoverAdCampaign & { post: DiscoverPost };
}

export function AdRow({ campaign }: AdRowProps) {
  const { post } = campaign;
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
    <li>
      <Link
        href={`/seller/ads/${campaign.id}`}
        className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40 sm:gap-4 sm:p-4"
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-20">
          {post.video.poster && (
            <Image
              src={post.video.poster}
              alt={post.caption ?? "Ad"}
              fill
              sizes="80px"
              className="object-cover"
            />
          )}
          <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-accent px-1.5 text-accent-foreground">
            <Zap className="size-2.5" />
            <Typography variant="label-sm">ad</Typography>
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Typography variant="label-md" className="line-clamp-1">
            {post.caption ?? "Untitled ad"}
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            Started {formatRelativeTime(campaign.startsAt)} •{" "}
            {expired ? "Ended" : `${daysLeft}d left`} • Spend{" "}
            {formatNaira(campaign.amountPaid)}
          </Typography>
        </div>

        <div className="hidden flex-col items-end gap-0.5 sm:flex">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="size-3.5" />
            <Typography variant="label-md" className="text-foreground">
              {post.impressions.toLocaleString("en-NG")}
            </Typography>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MousePointerClick className="size-3.5" />
            <Typography variant="caption">
              {post.clicks.toLocaleString("en-NG")} • {ctr}%
            </Typography>
          </div>
        </div>

        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
