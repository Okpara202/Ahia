import Link from "next/link";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";
import type { ChatPerspective } from "./ChatHeader";

interface ConversationRowProps {
  conversation: Conversation;
  perspective: ChatPerspective;
  basePath: string;
}

export function ConversationRow({
  conversation,
  perspective,
  basePath,
}: ConversationRowProps) {
  const { id, product, lastMessage, lastMessageAt, unread } = conversation;
  const counterparty =
    perspective === "buyer" ? conversation.seller : conversation.buyer;

  return (
    <Link
      href={`${basePath}/${id}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
        unread
          ? "border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.06]"
          : "border-border bg-card hover:bg-muted/30"
      )}
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {product.media.type === "image" ? (
          <Image
            src={product.media.url}
            alt={product.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <Image
            src={product.media.poster ?? ""}
            alt={product.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Typography variant="label-lg" className="truncate">
              {counterparty.name}
            </Typography>
            {counterparty.verified && (
              <BadgeCheck className="size-3.5 shrink-0 text-primary" />
            )}
          </div>
          <Typography
            variant="caption"
            className="shrink-0 text-muted-foreground"
          >
            {formatRelativeTime(lastMessageAt)}
          </Typography>
        </div>
        <Typography
          variant="body-sm"
          className={cn(
            "line-clamp-1",
            unread ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {lastMessage}
        </Typography>
        <Typography
          variant="caption"
          className="line-clamp-1 text-muted-foreground"
        >
          About: {product.name}
        </Typography>
      </div>

      {unread && (
        <span
          aria-label="Unread"
          className="size-2.5 shrink-0 rounded-full bg-primary"
        />
      )}
    </Link>
  );
}
