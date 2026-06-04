import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  Eye,
  MousePointerClick,
  Sparkles,
  Zap,
} from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import type { DiscoverPost } from "@/types";

interface AdRowProps {
  post: DiscoverPost;
  status: "boosted" | "organic" | "expired";
}

/**
 * Discover v2 row. Same density as before, but the visual state surfaces
 * whether a post is boosted (accent), organic (muted), or expired
 * (dimmed). Clicking opens the analytics page where the seller can boost
 * a free post or edit a boosted one.
 */
export function AdRow({ post, status }: AdRowProps) {
  // Server component renders at request time — clock read is intentional.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const expiresTs = post.expiresAt ? new Date(post.expiresAt).getTime() : null;
  const daysLeft =
    expiresTs !== null
      ? Math.max(0, Math.round((expiresTs - now) / (1000 * 60 * 60 * 24)))
      : null;

  const ctr =
    post.impressions > 0
      ? ((post.clicks / post.impressions) * 100).toFixed(1)
      : "0.0";

  const subtitleParts: string[] = [];
  if (status === "boosted" && daysLeft !== null)
    subtitleParts.push(`Sponsored · ${daysLeft}d left`);
  else if (status === "organic" && daysLeft !== null)
    subtitleParts.push(`Free · ${daysLeft}d left`);
  else if (status === "expired") subtitleParts.push("Expired");

  return (
    <li>
      <Link
        href={`/seller/ads/${post.id}`}
        className={cn(
          "flex items-center gap-3 p-3 transition-colors hover:bg-muted/40 sm:gap-4 sm:p-4",
          status === "expired" && "opacity-60"
        )}
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-20">
          {post.video.poster && (
            <Image
              src={post.video.poster}
              alt={post.caption ?? "Post"}
              fill
              sizes="80px"
              className="object-cover"
            />
          )}
          {status === "boosted" && (
            <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-accent px-1.5 text-accent-foreground">
              <Zap className="size-2.5" />
              <Typography variant="label-sm">ad</Typography>
            </span>
          )}
          {status === "organic" && (
            <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-background/85 px-1.5 text-muted-foreground backdrop-blur">
              <Sparkles className="size-2.5" />
              <Typography variant="label-sm">free</Typography>
            </span>
          )}
          {status === "expired" && (
            <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-foreground/80 px-1.5 text-background backdrop-blur">
              <Clock className="size-2.5" />
              <Typography variant="label-sm">ended</Typography>
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Typography variant="label-md" className="line-clamp-1">
            {post.caption ?? "Untitled post"}
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            {subtitleParts.join(" · ")}
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
              {post.clicks.toLocaleString("en-NG")} · {ctr}%
            </Typography>
          </div>
        </div>

        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
