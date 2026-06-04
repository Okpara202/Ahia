"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

import { Typography } from "@/components/Typography";
import { recordStoryView } from "@/lib/services/stories";
import type { Story } from "@/types";

interface StoryPermalinkClientProps {
  story: Story;
}

/**
 * Body of `/stories/[id]` — the OG-previewable shareable view. We hydrate
 * client-side for video autoplay + the view beacon. The page shell + meta
 * tags came from SSR (see page.tsx) so WhatsApp / Twitter etc. can render
 * the preview card without running JS.
 *
 * Layout choice: vertical media filling the viewport with a "Visit shop"
 * CTA underneath. No reply input here (the storefront's StoryViewer is
 * the place to reply); this is for casual visitors arriving via shared
 * link.
 */
export function StoryPermalinkClient({ story }: StoryPermalinkClientProps) {
  useEffect(() => {
    if (story.id) recordStoryView(story.id);
  }, [story.id]);

  if (!story.media) return null;
  const isVideo = story.media.type === "video";
  const shopHref = `/shops/${story.shopId}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 bg-background px-4 py-6">
      <div className="relative aspect-9/16 w-full max-w-sm overflow-hidden rounded-3xl bg-muted shadow-xl">
        {isVideo ? (
          <video
            src={story.media.url}
            poster={story.media.type === "video" ? story.media.poster : undefined}
            autoPlay
            muted
            playsInline
            loop
            controls
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={story.media.url}
            alt={story.caption ?? "Story"}
            fill
            sizes="(min-width: 640px) 400px, 100vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {story.caption && (
        <Typography
          variant="body-md"
          className="max-w-md px-2 text-center text-foreground"
        >
          {story.caption}
        </Typography>
      )}

      <Link
        href={shopHref}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Store className="size-4" />
        <Typography variant="label-md">Visit shop</Typography>
        <ArrowRight className="size-4" />
      </Link>

      {story.productId && (
        <Link
          href={`/products/${story.productId}`}
          className="inline-flex w-fit items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Typography variant="caption">View the product</Typography>
          <ArrowRight className="size-3" />
        </Link>
      )}
    </div>
  );
}
