"use client";

import { useEffect, useState } from "react";

import { ConversationRow } from "@/components/chat/ConversationRow";
import { EmptyInboxIllustration } from "@/components/illustrations";
import { PageLoader } from "@/components/PageLoader";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { getConversations } from "@/lib/services/conversations";
import { useChatStore } from "@/store/chatStore";
import type { ConversationListItem } from "@/types";

interface InboxListClientProps {
  basePath: string;
  heading: string;
  emptyTitle: string;
  emptyBody: string;
}

/**
 * Client-side inbox list. Cross-origin SSR can't see the session cookie
 * (CLAUDE.md §11c) so the fetch happens client-side.
 *
 * Reads the inbox from the live conversation store first (so live socket
 * updates flow through) and reconciles with the server's response on mount.
 */
export function InboxListClient({
  basePath,
  heading,
  emptyTitle,
  emptyBody,
}: InboxListClientProps) {
  const storeList = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getConversations()
      .then((list) => {
        if (cancelled) return;
        setConversations(list);
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[inbox-list] failed", {
          apiErr: extractApiError(err),
        });
        // Graceful degrade — render empty (or whatever's in the store).
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [setConversations]);

  if (!loaded && storeList.length === 0) {
    return <PageLoader fullScreen={false} label="Loading your inbox…" />;
  }

  const list: ConversationListItem[] = storeList;
  const unread = list.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <Typography variant="heading-h1">{heading}</Typography>
        {unread > 0 && (
          <Typography variant="label-md" className="text-primary">
            {unread} unread
          </Typography>
        )}
      </header>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
          <EmptyInboxIllustration className="size-32 text-primary/40" />
          <Typography variant="heading-h4">{emptyTitle}</Typography>
          <Typography variant="body-sm" className="max-w-xs text-muted-foreground">
            {emptyBody}
          </Typography>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              basePath={basePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}
