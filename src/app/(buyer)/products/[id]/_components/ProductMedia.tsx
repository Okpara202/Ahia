"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import type { Media, Shop } from "@/types";

interface ProductMediaProps {
  media: Media;
  gallery?: Media[];
  shop: Shop;
  name: string;
}

export function ProductMedia({ media, gallery, shop, name }: ProductMediaProps) {
  const items = [media, ...(gallery ?? [])];
  const [index, setIndex] = useState(0);
  const current = items[index] ?? media;
  const hasMultiple = items.length > 1;

  function go(delta: number) {
    setIndex((i) => (i + delta + items.length) % items.length);
  }

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-20">
      <div className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
        {current.type === "image" ? (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt ?? name}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority={index === 0}
          />
        ) : (
          <AutoPlayVideo url={current.url} poster={current.poster} />
        )}

        {shop.verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-primary backdrop-blur">
            <BadgeCheck className="size-3.5" />
            <Typography variant="label-sm">Verified shop</Typography>
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {items.map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-5 bg-background" : "w-1.5 bg-background/60"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((m, i) => {
            const thumb = m.type === "image" ? m.url : m.poster ?? "";
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-lg transition-all sm:size-20",
                  i === index
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100"
                )}
              >
                {thumb && (
                  <Image
                    src={thumb}
                    alt={`${name} thumbnail ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AutoPlayVideo({ url, poster }: { url: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
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
      className="size-full object-cover"
    />
  );
}
