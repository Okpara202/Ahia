"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck, X } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import type { ImageMessage } from "@/types";

interface ImageMessageCardProps {
  message: ImageMessage;
  mine: boolean;
}

export function ImageMessageCard({ message, mine }: ImageMessageCardProps) {
  const [lightbox, setLightbox] = useState(false);
  const caption = message.content;
  const isAdmin = message.senderType === "admin";

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-1",
          mine && !isAdmin ? "items-end" : "items-start"
        )}
      >
        {isAdmin && (
          <div className="flex items-center gap-1 px-1 text-accent">
            <ShieldCheck className="size-3.5" />
            <Typography variant="caption" className="font-medium">
              {message.senderName ?? "Ahia Support"}
            </Typography>
          </div>
        )}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Open image"
          className={cn(
            "relative h-56 w-44 overflow-hidden rounded-2xl bg-muted sm:h-64 sm:w-52",
            isAdmin
              ? "rounded-bl-md ring-2 ring-accent/40"
              : mine
                ? "rounded-br-md"
                : "rounded-bl-md"
          )}
        >
          <Image
            src={message.imageUrl}
            alt={caption ?? "Shared image"}
            fill
            sizes="208px"
            className="object-cover"
            unoptimized={message.imageUrl.startsWith("blob:")}
          />
        </button>
        {caption && (
          <Typography variant="caption" className="px-1 text-muted-foreground">
            {caption}
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
              src={message.imageUrl}
              alt={caption ?? "Shared image"}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized={message.imageUrl.startsWith("blob:")}
            />
          </div>
        </div>
      )}
    </>
  );
}
