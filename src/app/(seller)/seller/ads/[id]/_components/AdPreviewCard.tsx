import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";

import { Typography } from "@/components/Typography";
import type { DiscoverPost } from "@/types";

interface AdPreviewCardProps {
  post: DiscoverPost;
}

export function AdPreviewCard({ post }: AdPreviewCardProps) {
  const targetHref =
    post.cta.type === "product"
      ? `/products/${post.cta.productId}`
      : `/shops/${post.cta.shopId}`;
  const targetLabel = post.cta.type === "product" ? "Product" : "Shop";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="relative mx-auto aspect-9/16 w-44 overflow-hidden rounded-xl bg-black sm:w-52">
        {post.video.poster && (
          <Image
            src={post.video.poster}
            alt={post.caption ?? "Ad preview"}
            fill
            sizes="(min-width: 1024px) 33vw, 80vw"
            className="object-cover"
          />
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
          <Zap className="size-3" />
          <Typography variant="label-sm">Sponsored</Typography>
        </span>
        {post.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent p-3">
            <Typography variant="label-md" className="text-white line-clamp-3">
              {post.caption}
            </Typography>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Typography variant="caption" className="text-muted-foreground">
          Sends buyers to {targetLabel.toLowerCase()}
        </Typography>
        <Link
          href={targetHref}
          className="inline-flex w-fit items-center gap-1.5 text-primary hover:underline"
        >
          <Typography variant="label-sm">View {targetLabel.toLowerCase()}</Typography>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
