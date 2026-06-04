"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Story } from "@/types";

const STORY_DURATION_MS = 6000;

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  shopName: string;
  onClose: () => void;
}

export function StoryViewer({
  stories,
  initialIndex,
  shopName,
  onClose,
}: StoryViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const story = stories[index];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(0);
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.min(1, elapsed / STORY_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) {
        window.clearInterval(id);
        if (index < stories.length - 1) {
          setIndex(index + 1);
        } else {
          onClose();
        }
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [index, stories.length, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, stories.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [stories.length, onClose]);

  if (!story || !story.media) return null;
  const isVideo = story.media.type === "video";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-in fade-in duration-200">
      <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
        {stories.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
          >
            <div
              className={cn(
                "h-full bg-white transition-[width]",
                i < index && "w-full",
                i === index && "duration-100",
                i > index && "w-0"
              )}
              style={{
                width: i === index ? `${progress * 100}%` : undefined,
              }}
            />
          </div>
        ))}
      </div>

      <header className="absolute inset-x-4 top-8 z-10 flex items-center justify-between gap-3 pt-3 text-white">
        <div className="flex flex-col">
          <Typography variant="label-lg">{shopName}</Typography>
          <Typography variant="caption" className="text-white/70">
            {formatRelativeTime(story.createdAt)}
          </Typography>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close stories"
          className="grid size-9 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors hover:bg-white/25"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="relative flex-1">
        {isVideo ? (
          <video
            key={story.id}
            src={story.media.url}
            poster={story.media.type === "video" ? story.media.poster : undefined}
            autoPlay
            muted
            playsInline
            loop
            className="absolute inset-0 h-full w-full object-contain animate-in fade-in duration-300"
          />
        ) : (
          <Image
            key={story.id}
            src={story.media.url}
            alt={story.caption ?? "Story"}
            fill
            sizes="100vw"
            className="object-contain animate-in fade-in duration-300"
            priority
          />
        )}

        <button
          type="button"
          aria-label="Previous story"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="absolute inset-y-0 left-0 w-1/3"
        />
        <button
          type="button"
          aria-label="Next story"
          onClick={() =>
            index < stories.length - 1 ? setIndex(index + 1) : onClose()
          }
          className="absolute inset-y-0 right-0 w-1/3"
        />

        {index > 0 && (
          <button
            type="button"
            aria-label="Previous"
            onClick={() => setIndex(index - 1)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur hover:bg-white/25 md:block"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        {index < stories.length - 1 && (
          <button
            type="button"
            aria-label="Next"
            onClick={() => setIndex(index + 1)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur hover:bg-white/25 md:block"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-3 bg-linear-to-t from-black/90 to-transparent px-4 pb-8 pt-12 text-white">
        {story.caption && (
          <Typography variant="body-md" className="max-w-2xl">
            {story.caption}
          </Typography>
        )}
        {story.productId && (
          <Link
            href={`/products/${story.productId}`}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 text-accent-foreground"
          >
            <Typography variant="label-md">View product</Typography>
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
