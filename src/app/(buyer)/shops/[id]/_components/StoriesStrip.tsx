"use client";

import { useState } from "react";
import Image from "next/image";

import { Typography } from "@/components/Typography";
import type { Story } from "@/types";
import { StoryViewer } from "./StoryViewer";

interface StoriesStripProps {
  stories: Story[];
  shopName: string;
}

export function StoriesStrip({ stories, shopName }: StoriesStripProps) {
  const [viewerOpenAt, setViewerOpenAt] = useState<number | null>(null);

  if (stories.length === 0) return null;

  return (
    <>
      <section className="flex flex-col gap-3">
        <Typography variant="overline" className="text-muted-foreground">
          Latest drops
        </Typography>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {stories.map((story, i) => {
            // Crash guard: backend currently ships stories without `media`.
            // Skip until the canonical shape lands (see backend ask doc).
            if (!story.media) return null;
            const thumb =
              story.media.type === "image"
                ? story.media.url
                : story.media.poster ?? "";
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => setViewerOpenAt(i)}
                aria-label={`Open story ${i + 1}: ${story.caption ?? ""}`}
                className="group flex shrink-0 flex-col items-center gap-1.5"
              >
                <span className="rounded-full bg-linear-to-br from-primary via-accent to-primary p-[2px] transition-transform group-hover:scale-105">
                  <span className="block rounded-full bg-background p-[2px]">
                    <span className="relative block size-16 overflow-hidden rounded-full bg-muted">
                      {thumb && (
                        <Image
                          src={thumb}
                          alt={story.caption ?? "Story"}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </span>
                  </span>
                </span>
                <Typography
                  variant="caption"
                  className="max-w-[70px] truncate text-muted-foreground"
                >
                  {i === 0 ? shopName : `Drop ${i + 1}`}
                </Typography>
              </button>
            );
          })}
        </div>
      </section>

      {viewerOpenAt !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewerOpenAt}
          shopName={shopName}
          onClose={() => setViewerOpenAt(null)}
        />
      )}
    </>
  );
}
