"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import type { ImageMessage } from "@/types";

interface ImageMessageCardProps {
  message: ImageMessage;
  mine: boolean;
}

export function ImageMessageCard({ message, mine }: ImageMessageCardProps) {
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-1",
          mine ? "items-end" : "items-start"
        )}
      >
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Open image"
          className={cn(
            "relative h-56 w-44 overflow-hidden rounded-2xl bg-muted sm:h-64 sm:w-52",
            mine ? "rounded-br-md" : "rounded-bl-md"
          )}
        >
          <Image
            src={message.url}
            alt={message.alt ?? "Shared image"}
            fill
            sizes="208px"
            className="object-cover"
          />
        </button>
        {message.caption && (
          <Typography variant="caption" className="px-1 text-muted-foreground">
            {message.caption}
          </Typography>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            aria-label="Close image"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          <div className="relative h-[90vh] w-full max-w-4xl">
            <Image
              src={message.url}
              alt={message.alt ?? "Shared image"}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
