"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { ConversationRow } from "@/components/chat/ConversationRow";
import { EmptyInboxIllustration } from "@/components/illustrations";
import { PageLoader } from "@/components/PageLoader";
import { Typography } from "@/components/Typography";
import { startConversation } from "@/lib/actions/conversations";
import {
  getConversations,
} from "@/lib/services/conversations";
import { extractApiError } from "@/lib/api";
import { toast } from "@/store/toastStore";
import type { Conversation } from "@/types";
import type { ChatPerspective } from "./ChatHeader";

interface InboxListClientProps {
  perspective: ChatPerspective;
  basePath: string;
  /** Page-level heading copy + empty state. */
  heading: string;
  emptyTitle: string;
  emptyBody: string;
  /** Buyer-only deep links handed in by the server shell. Seller route ignores. */
  productDeepLink?: string;
  shopDeepLink?: string;
}

/**
 * Client-side loader for the inbox list page. Two responsibilities:
 *
 *   1. Fetch the conversation list (cross-origin SSR can't see the session
 *      cookie — same constraint as the thread page). See CLAUDE.md §11c.
 *   2. Handle the buyer-side `?product=...` / `?shop=...` deep link that
 *      lands here from "Message the shop" CTAs. We find-or-create the
 *      conversation, then `router.replace()` to the thread.
 *
 * Shared between buyer and seller. Seller never passes deep-link params.
 */
export function InboxListClient({
  perspective,
  basePath,
  heading,
  emptyTitle,
  emptyBody,
  productDeepLink,
  shopDeepLink,
}: InboxListClientProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[] | null>(
    null
  );
  const isDeepLinking = !!(productDeepLink || shopDeepLink);

  useEffect(() => {
    let cancelled = false;

    if (productDeepLink || shopDeepLink) {
      // Deep-link path — resolve the conversation, replace the URL with the
      // thread, never render the list under it.
      startConversation({
        productId: productDeepLink,
        shopId: shopDeepLink,
      })
        .then(({ conversationId }) => {
          if (cancelled) return;
          router.replace(`${basePath}/${conversationId}`);
        })
        .catch((err) => {
          if (cancelled) return;
          const code = extractApiError(err)?.code;
          if (code === "shop_paused" || code === "shop_gone") {
            toast.error(
              "This seller is on a break",
              "Follow them to know when they reopen."
            );
          } else if (code === "self_conversation") {
            toast.error("That's your own shop", "You can't message yourself.");
          } else if (!axios.isAxiosError(err) || err.response?.status !== 401) {
            // 401 is already redirected by the auth interceptor. Anything else
            // — fall through to the list view rather than hanging on a loader.
            toast.error(
              "Couldn't open that chat",
              extractApiError(err)?.message ?? "Try again in a moment."
            );
          }
          // Fall back to loading the regular inbox.
          getConversations()
            .then((list) => !cancelled && setConversations(list))
            .catch(() => !cancelled && setConversations([]));
        });
      return () => {
        cancelled = true;
      };
    }

    getConversations()
      .then((list) => {
        if (cancelled) return;
        setConversations(list);
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 → interceptor handles. Any other failure → render empty list
        // (graceful degrade; user can refresh).
        console.warn("[inbox-list] failed", {
          apiErr: extractApiError(err),
        });
        setConversations([]);
      });

    return () => {
      cancelled = true;
    };
  }, [productDeepLink, shopDeepLink, basePath, router]);

  if (isDeepLinking && !conversations) {
    return <PageLoader fullScreen={false} label="Opening conversation…" />;
  }

  if (!conversations) {
    return (
      <PageLoader fullScreen={false} label="Loading your inbox…" />
    );
  }

  const unread = conversations.filter((c) => c.unread).length;

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

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
          <EmptyInboxIllustration className="size-32 text-primary/40" />
          <Typography variant="heading-h4">{emptyTitle}</Typography>
          <Typography variant="body-sm" className="max-w-xs text-muted-foreground">
            {emptyBody}
          </Typography>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {conversations.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              perspective={perspective}
              basePath={basePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}
