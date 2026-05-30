"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/PageLoader";
import { Typography } from "@/components/Typography";
import { apiClient, extractApiError } from "@/lib/api";
import { mapConversation, mapMessage } from "@/lib/services/conversations";
import type { Conversation, Message } from "@/types";
import { ChatThread } from "./ChatThread";
import type { ChatPerspective } from "./ChatHeader";

interface ChatThreadLoaderProps {
  id: string;
  perspective: ChatPerspective;
  inboxHref: string;
}

interface ConversationPayload {
  conversation: Conversation;
  messages: Message[];
}

/**
 * Client-side loader for a single conversation thread.
 *
 * Sits between the (server-rendered) page shell and the (client) ChatThread.
 * The fetch HAS to happen on the client because our split-origin prototype
 * means Next.js SSR can't see the backend's session cookie — same constraint
 * as `getCurrentUser()` returning null cross-origin (see CLAUDE.md §11c).
 *
 * Shared between buyer (/inbox/[id]) and seller (/seller/inbox/[id]) routes;
 * caller picks the perspective + inboxHref.
 *
 * When `ahia.ng` ships and SSR can see the cookie again, the page can
 * optionally inline the fetch server-side and pass `initial*` props for
 * faster first paint. Loader stays as the fallback / mid-session refetch.
 */
export function ChatThreadLoader({
  id,
  perspective,
  inboxHref,
}: ChatThreadLoaderProps) {
  const router = useRouter();
  const [data, setData] = useState<ConversationPayload | null>(null);
  const [error, setError] = useState<"not_found" | "other" | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();

    apiClient()
      .get<{ conversation: unknown; messages: unknown[] }>(
        `/conversations/${id}`,
        {
          signal: ctrl.signal,
          // Cross-origin + credentials + Edge's double-keyed HTTP cache means
          // the body isn't reliably stored on the first hit. A second fetch
          // (e.g. StrictMode in dev) gets back a bare 304 with no cached
          // body. validateStatus < 400 keeps 304 from throwing; the cache-
          // bust query param keeps the backend from issuing 304 in the first
          // place. Both are belts-and-braces — either one alone would work.
          // Remove once the backend disables ETag on authed endpoints or we
          // move same-origin.
          params: { _t: id },
          validateStatus: (s) => s >= 200 && s < 400,
        }
      )
      .then(({ data: payload }) => {
        if (ctrl.signal.aborted) return;
        if (!payload?.conversation) {
          // Defensive: empty 304 made it through validateStatus. Fall through
          // to the "other" branch rather than crashing the mapper.
          throw new Error("Empty conversation payload");
        }
        setData({
          conversation: mapConversation(payload.conversation),
          messages: (payload.messages ?? []).map(mapMessage),
        });
      })
      .catch((err) => {
        if (axios.isCancel(err) || ctrl.signal.aborted) return;
        // 401s are caught by the global auth interceptor and redirect to
        // /help/sign-in-blocked — we won't see them here.
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError("not_found");
        } else {
          console.warn("[chat-thread-loader] failed", {
            id,
            apiErr: extractApiError(err),
            errName: err instanceof Error ? err.name : undefined,
            errMessage: err instanceof Error ? err.message : String(err),
            status: axios.isAxiosError(err)
              ? err.response?.status
              : undefined,
          });
          setError("other");
        }
      });

    return () => ctrl.abort();
  }, [id]);

  if (error === "not_found") {
    return (
      <ErrorState
        title="Conversation not found"
        body="This chat doesn't exist or you don't have access to it."
        onBack={() => router.replace(inboxHref)}
      />
    );
  }

  if (error === "other") {
    return (
      <ErrorState
        title="Couldn't load this chat"
        body="Network or server hiccup. Refresh to try again."
        onBack={() => router.replace(inboxHref)}
      />
    );
  }

  if (!data) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] flex-col">
        <PageLoader fullScreen={false} label="Loading conversation…" />
      </div>
    );
  }

  return (
    <ChatThread
      conversation={data.conversation}
      initialMessages={data.messages}
      perspective={perspective}
      inboxHref={inboxHref}
    />
  );
}

interface ErrorStateProps {
  title: string;
  body: string;
  onBack: () => void;
}

function ErrorState({ title, body, onBack }: ErrorStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <Typography variant="heading-h2">{title}</Typography>
      <Typography variant="body-md" className="text-muted-foreground">
        {body}
      </Typography>
      <Button type="button" onClick={onBack} variant="outline" size="lg">
        <ArrowLeft className="size-4" />
        Back to inbox
      </Button>
    </div>
  );
}
