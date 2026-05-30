"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  /** If provided, clicks on the image and title open this handler instead of
   * navigating to the product page. Used by the feed's quick-view sheet. */
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const { id, name, price, media, shop, sponsored } = product;
  const useQuickView = !!onSelect;

  const HeroTag = useQuickView ? "button" : Link;
  const heroProps = useQuickView
    ? {
        type: "button" as const,
        onClick: () => onSelect!(product),
        "aria-label": name,
      }
    : { href: `/products/${id}`, "aria-label": name };

  const TitleTag = useQuickView ? "button" : Link;
  const titleProps = useQuickView
    ? {
        type: "button" as const,
        onClick: () => onSelect!(product),
      }
    : { href: `/products/${id}` };

  return (
    <div className="group flex flex-col gap-2.5 rounded-2xl transition-transform duration-200 animate-in fade-in slide-in-from-bottom-2 fill-mode-both hover:-translate-y-0.5">
      <HeroTag
        {...(heroProps as React.ComponentProps<"button"> &
          React.ComponentProps<typeof Link>)}
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted shadow-xs transition-shadow duration-200 group-hover:shadow-md"
      >
        {media.type === "image" ? (
          <Image
            src={media.url}
            alt={media.alt ?? name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <FeedVideo url={media.url} poster={media.poster} />
        )}

        {shop.verified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-primary backdrop-blur">
            <BadgeCheck className="size-3" />
            <Typography variant="label-sm">Verified</Typography>
          </span>
        )}

        {sponsored && (
          <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-card/85 px-2 py-0.5 text-muted-foreground backdrop-blur">
            <Typography variant="label-sm">Promoted</Typography>
          </span>
        )}
      </HeroTag>

      <div className="flex flex-col gap-1 px-0.5">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <TitleTag
            {...(titleProps as React.ComponentProps<"button"> &
              React.ComponentProps<typeof Link>)}
            className="min-w-0 text-left hover:text-primary sm:flex-1"
          >
            {/* line-clamp-2 caps long titles at two lines with an ellipsis on
                the second line. Keeps card heights in a tight band even when
                sellers paste full marketing names. */}
            <Typography variant="heading-h4" className="line-clamp-2 wrap-break-word">
              {name}
            </Typography>
          </TitleTag>
          <Typography
            variant="price-md"
            className="whitespace-nowrap text-primary"
          >
            {formatNaira(price)}
          </Typography>
        </div>
        <Link
          href={`/shops/${shop.id}`}
          className="truncate text-muted-foreground hover:text-foreground hover:underline"
        >
          <Typography variant="caption">{shop.handle}</Typography>
        </Link>
      </div>
    </div>
  );
}

function FeedVideo({ url, poster }: { url: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            /* autoplay can be blocked — fail silently */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={url}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}
