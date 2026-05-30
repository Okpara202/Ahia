import Link from "next/link";
import Image from "next/image";
import { Store } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/types";

interface ConversationRowProps {
  conversation: ConversationListItem;
  basePath: string;
}

export function ConversationRow({
  conversation,
  basePath,
}: ConversationRowProps) {
  const { id, counterparty, shop, lastMessage, lastActivityAt, unreadCount } =
    conversation;
  const unread = unreadCount > 0;

  return (
    <Link
      href={`${basePath}/${id}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
        unread
          ? "border-primary/30 bg-primary/3 hover:bg-primary/6"
          : "border-border bg-card hover:bg-muted/30"
      )}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
        {counterparty.avatarUrl ? (
          <Image
            src={counterparty.avatarUrl}
            alt={counterparty.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="grid size-full place-items-center bg-primary/10 text-primary"
          >
            <Typography variant="label-md" className="font-bold">
              {counterparty.name.charAt(0)}
            </Typography>
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <Typography variant="label-lg" className="truncate">
            {counterparty.name}
          </Typography>
          <Typography
            variant="caption"
            className="shrink-0 text-muted-foreground"
          >
            {formatRelativeTime(lastActivityAt)}
          </Typography>
        </div>
        <Typography
          variant="body-sm"
          className={cn(
            "line-clamp-1",
            unread ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {lastMessage?.snippet ?? "No messages yet"}
        </Typography>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Store className="size-3" />
          <Typography variant="caption" className="line-clamp-1">
            @{shop.handle}
            {!shop.isActive && " · on a break"}
          </Typography>
        </div>
      </div>

      {unread && (
        <span
          aria-label={`${unreadCount} unread`}
          className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground"
        >
          <Typography variant="label-sm" className="text-[10px] leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Typography>
        </span>
      )}
    </Link>
  );
}
