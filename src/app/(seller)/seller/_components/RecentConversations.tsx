import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatRelativeTime } from "@/lib/format";
import type { ConversationListItem } from "@/types";

interface RecentConversationsProps {
  conversations: ConversationListItem[];
}

export function RecentConversations({
  conversations,
}: RecentConversationsProps) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <header className="flex items-center justify-between">
        <Typography variant="heading-h4">Unread messages</Typography>
        <Link
          href="/seller/inbox"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <Typography variant="label-sm">Open inbox</Typography>
          <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <MessageCircle className="size-5" />
          </span>
          <Typography variant="body-sm" className="text-muted-foreground">
            All caught up.
          </Typography>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/seller/inbox/${c.id}`}
                className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
              >
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
                >
                  <Typography variant="label-md">
                    {c.counterparty.name.charAt(0)}
                  </Typography>
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-baseline justify-between gap-2">
                    <Typography variant="label-md" className="truncate">
                      {c.counterparty.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      className="shrink-0 text-muted-foreground"
                    >
                      {formatRelativeTime(c.lastActivityAt)}
                    </Typography>
                  </div>
                  <Typography
                    variant="body-sm"
                    className="line-clamp-1 text-muted-foreground"
                  >
                    {c.lastMessage?.snippet ?? "No messages yet"}
                  </Typography>
                </div>
                {c.unreadCount > 0 && (
                  <span
                    aria-hidden
                    className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
