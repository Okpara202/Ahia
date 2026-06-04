"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";

import { Typography } from "@/components/Typography";
import type { StoryContext } from "@/types";

interface StoryContextBlockProps {
  context: StoryContext;
  /** Match the bubble side so the block tucks under the message header. */
  mine: boolean;
}

/**
 * Snapshot preview rendered above a message that was sent via "Reply to
 * story" in the StoryViewer. Keeps rendering forever (even after the
 * story expired) because the snapshot lives on the message row itself.
 */
export function StoryContextBlock({ context, mine }: StoryContextBlockProps) {
  const thumb = context.mediaType === "video" ? context.posterUrl : context.mediaUrl;
  return (
    <div
      className={
        mine
          ? "ml-auto flex max-w-xs items-center gap-2 rounded-xl rounded-br-sm border border-primary/30 bg-primary/5 p-2"
          : "mr-auto flex max-w-xs items-center gap-2 rounded-xl rounded-bl-sm border border-border bg-muted/40 p-2"
      }
    >
      <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {thumb ? (
          <Image
            src={thumb}
            alt={context.caption ?? "Story"}
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="grid h-full place-items-center text-muted-foreground">
            <Sparkles className="size-4" />
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Sparkles className="size-3" />
          <Typography variant="caption">Replied to story</Typography>
        </div>
        {context.caption && (
          <Typography variant="caption" className="truncate">
            {context.caption}
          </Typography>
        )}
      </div>
    </div>
  );
}
