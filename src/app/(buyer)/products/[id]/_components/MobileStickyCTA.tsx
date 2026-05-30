"use client";

import { Bookmark, Loader2, MessageCircle } from "lucide-react";

import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MobileStickyCTAProps {
  onChat: () => void;
  onSave: () => void;
  saved: boolean;
  opening: boolean;
  /** Seller's shop is paused — chat CTA renders disabled. */
  paused?: boolean;
  /** Viewer owns the shop. Hides the chat CTA entirely; Save + Share stay
   *  useful (the seller may want to share their own product link). */
  isOwner?: boolean;
  shareUrl: string;
  shareTitle: string;
  shareText?: string;
}

export function MobileStickyCTA({
  onChat,
  onSave,
  saved,
  opening,
  paused,
  isOwner,
  shareUrl,
  shareTitle,
  shareText,
}: MobileStickyCTAProps) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={onSave}
              variant="outline"
              size="lg"
              aria-label={saved ? "Saved" : "Save for later"}
              className="shrink-0 px-3"
            >
              <Bookmark
                className={cn("size-5", saved && "fill-primary text-primary")}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {saved ? "Remove from saved" : "Save for later"}
          </TooltipContent>
        </Tooltip>
        <ShareButton url={shareUrl} title={shareTitle} text={shareText} />
        {isOwner ? null : paused ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled
            className="flex-1"
            title="This seller is paused"
          >
            <MessageCircle className="size-4" />
            Paused
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onChat}
            variant="cta"
            size="lg"
            disabled={opening}
            className="flex-1"
          >
            {opening ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageCircle className="size-4" />
            )}
            {opening ? "Opening chat…" : "Message the shop"}
          </Button>
        )}
      </div>
    </div>
  );
}
