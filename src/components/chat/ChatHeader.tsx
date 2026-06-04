"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { Typography } from "@/components/Typography";
import { useUserPresence } from "@/store/presenceStore";
import type { ConversationDetail } from "@/types";

function presenceLabel(online: boolean, lastSeenAt: string | null): string {
  if (online) return "Active now";
  if (!lastSeenAt) return "Offline";
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Last seen ${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `Last seen ${days}d ago`;
}

export type ChatPerspective = "buyer" | "seller";

interface ChatHeaderProps {
  conversation: ConversationDetail;
  perspective: ChatPerspective;
  inboxHref: string;
}

/**
 * Top bar for an open chat thread.
 *
 * Chat v1: conversations are per-seller, not per-product, so there's no
 * single product to badge here. Buyer perspective shows the counterparty
 * (seller user) and links the row to the seller's storefront via the
 * embedded shop record. Seller perspective shows the buyer with no link
 * (we don't have a buyer-profile page).
 */
export function ChatHeader({
  conversation,
  perspective,
  inboxHref,
}: ChatHeaderProps) {
  const counterparty =
    perspective === "buyer" ? conversation.seller : conversation.buyer;
  const shopHref =
    perspective === "buyer" ? `/shops/${conversation.shop.id}` : null;
  const presence = useUserPresence(counterparty.id);

  const AvatarInner = counterparty.avatarUrl ? (
    <Image
      src={counterparty.avatarUrl}
      alt={counterparty.name}
      width={36}
      height={36}
      className="size-9 rounded-full object-cover"
    />
  ) : (
    <span
      aria-hidden
      className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary"
    >
      <Typography variant="label-md" className="font-bold">
        {counterparty.name.charAt(0)}
      </Typography>
    </span>
  );

  const Avatar = (
    <span className="relative shrink-0">
      {AvatarInner}
      {presence.online && (
        <span
          aria-label="Online"
          className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-success"
        />
      )}
    </span>
  );

  const subtitle =
    perspective === "buyer"
      ? `@${conversation.shop.handle}${
          !conversation.shop.isActive ? " · on a break" : ""
        } · ${presenceLabel(presence.online, presence.lastSeenAt)}`
      : presenceLabel(presence.online, presence.lastSeenAt);

  const NameBlock = (
    <>
      {Avatar}
      <div className="flex min-w-0 flex-col">
        <Typography variant="label-lg" className="truncate">
          {counterparty.name}
        </Typography>
        <Typography
          variant="caption"
          className="truncate text-muted-foreground"
        >
          {subtitle}
        </Typography>
      </div>
    </>
  );

  return (
    <header className="flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <Link
        href={inboxHref}
        aria-label="Back to inbox"
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
      </Link>

      {shopHref ? (
        <Link
          href={shopHref}
          className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
        >
          {NameBlock}
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {NameBlock}
        </div>
      )}
    </header>
  );
}
