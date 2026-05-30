import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { Typography } from "@/components/Typography";
import type { ConversationDetail } from "@/types";

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

  const Avatar = counterparty.avatarUrl ? (
    <Image
      src={counterparty.avatarUrl}
      alt={counterparty.name}
      width={36}
      height={36}
      className="size-9 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
    >
      <Typography variant="label-md" className="font-bold">
        {counterparty.name.charAt(0)}
      </Typography>
    </span>
  );

  const NameBlock = (
    <>
      {Avatar}
      <div className="flex min-w-0 flex-col">
        <Typography variant="label-lg" className="truncate">
          {counterparty.name}
        </Typography>
        {perspective === "buyer" && (
          <Typography
            variant="caption"
            className="truncate text-muted-foreground"
          >
            @{conversation.shop.handle}
            {!conversation.shop.isActive && " · on a break"}
          </Typography>
        )}
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
