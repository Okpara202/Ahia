"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bookmark,
  Heart,
  MessageCircle,
  Store,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/Typography";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { MY_SHOP } from "@/lib/mocks/seller";
import { MOCK_SHOPS } from "@/lib/mocks/shops";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { DiscoverFeedItem } from "@/types";

const ALL_SHOPS = [...MOCK_SHOPS, MY_SHOP];

interface DiscoverItemProps {
  post: DiscoverFeedItem;
  muted: boolean;
}

export function DiscoverItem({ post, muted }: DiscoverItemProps) {
  const { id, video, caption, cta, sponsored } = post;
  const shop = ALL_SHOPS.find((s) => s.id === post.shopId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const requireAuth = useRequireAuth();

  const ctaHref =
    cta.type === "product" ? `/products/${cta.productId}` : `/shops/${cta.shopId}`;
  const chatHref =
    cta.type === "product"
      ? `/inbox?product=${cta.productId}`
      : `/inbox?shop=${cta.shopId}`;

  const saveable = cta.type === "product";
  const saveTarget = cta.type === "product" ? cta.productId : "";
  const saved = useWishlistStore((s) => s.isSaved(saveTarget));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  function handleSave() {
    if (!saveable) return;
    const next = toggleWishlist(saveTarget);
    toast.success(next ? "Saved" : "Removed from saved");
  }

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0.7) {
          v.play().catch(() => {});
        } else {
          v.pause();
          v.currentTime = 0;
        }
      },
      { threshold: [0, 0.7, 1] }
    );
    observer.observe(v);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="relative h-full w-full snap-start snap-always overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={video.url}
        poster={video.poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full object-cover"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-black/30"
      />

      {sponsored && (
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-white backdrop-blur-md lg:left-8">
          <Typography variant="label-sm">Sponsored</Typography>
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-4 pb-24 text-white md:pb-8 lg:px-8">
        <div className="flex max-w-md min-w-0 flex-col gap-3">
          {shop && (
            <Link
              href={`/shops/${shop.id}`}
              className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1 backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <Typography variant="label-md">{shop.handle}</Typography>
              {shop.verified && <BadgeCheck className="size-3.5 text-success" />}
            </Link>
          )}
          {caption && (
            <Typography variant="heading-h3" className="text-white">
              {caption}
            </Typography>
          )}
          <Link
            href={ctaHref}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 text-accent-foreground shadow-lg transition-transform hover:scale-105"
          >
            {cta.type === "product" ? (
              <>
                <Typography variant="label-md">View product</Typography>
              </>
            ) : (
              <>
                <Store className="size-4" />
                <Typography variant="label-md">View shop</Typography>
              </>
            )}
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth("to like this video")) return;
                  setLiked((v) => !v);
                }}
                aria-label={liked ? "Unlike" : "Like"}
                aria-pressed={liked}
                className={ACTION_BTN}
              >
                <Heart
                  className={cn("size-6", liked && "fill-accent text-accent")}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {liked ? "Unlike" : "Like"}
            </TooltipContent>
          </Tooltip>
          {saveable && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleSave}
                  aria-label={saved ? "Unsave" : "Save"}
                  aria-pressed={saved}
                  className={ACTION_BTN}
                >
                  <Bookmark
                    className={cn("size-6", saved && "fill-white text-white")}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {saved ? "Remove from saved" : "Save"}
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={chatHref}
                aria-label="Chat with seller"
                onClick={(e) => {
                  if (!requireAuth("to chat with this seller")) {
                    e.preventDefault();
                  }
                }}
                className={ACTION_BTN}
              >
                <MessageCircle className="size-6" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">Chat with seller</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* unique key alias used by sentinel pagination */}
      <span hidden id={`d-${id}`} />
    </article>
  );
}

const ACTION_BTN =
  "grid size-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25";
