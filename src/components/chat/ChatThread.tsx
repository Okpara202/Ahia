"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  markConversationRead as serverMarkConversationRead,
  sendImageMessage,
  sendTextMessage,
  sendVoiceMessage,
} from "@/lib/services/conversations";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { toast } from "@/store/toastStore";
import type { ConversationDetail, Message } from "@/types";
import { ChatHeader, type ChatPerspective } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { WarningBanner } from "./WarningBanner";

interface ChatThreadProps {
  conversation: ConversationDetail;
  initialMessages: Message[];
  perspective: ChatPerspective;
  inboxHref: string;
}

function emptyMessageBase(conversationId: string, senderId: string) {
  return {
    conversationId,
    senderId,
    createdAt: new Date().toISOString(),
    editedAt: null,
    deliveredAt: null,
    readAt: null,
    reactions: [],
    contextProduct: null,
    storyContext: null,
  };
}

export function ChatThread({
  conversation,
  initialMessages,
  perspective,
  inboxHref,
}: ChatThreadProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const messagesInStore = useChatStore(
    (s) => s.messagesByConversation[conversation.id]
  );
  const addMessage = useChatStore((s) => s.addMessage);
  const replaceMessage = useChatStore((s) => s.replaceMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);

  // WhatsApp-reply-style product attachment. Set when the user lands on this
  // chat from a product page (URL carries `?ctx=<productId>`). Attaches to
  // the next message they send, then clears.
  const [pendingContextProductId, setPendingContextProductId] = useState<
    string | null
  >(null);
  const consumedRef = useRef(false);

  useEffect(() => {
    const ctx = searchParams.get("ctx");
    if (ctx && !consumedRef.current) {
      setPendingContextProductId(ctx);
    }
  }, [searchParams]);

  function clearPendingContext() {
    setPendingContextProductId(null);
    consumedRef.current = true;
    // Drop ?ctx= from the URL so a reload doesn't re-attach.
    const next = new URLSearchParams(searchParams.toString());
    next.delete("ctx");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const store = useChatStore.getState();
    if (!store.messagesByConversation[conversation.id]) {
      store.setMessages(conversation.id, initialMessages);
    }
    store.markConversationRead(conversation.id);
    store.openConversation(conversation.id);
    return () => {
      useChatStore.getState().closeConversation(conversation.id);
    };
  }, [conversation.id, initialMessages]);

  const messages = messagesInStore ?? initialMessages;

  // Tell the server the user has read up through the latest incoming message
  // in this thread. Without this, GET /conversations keeps returning a stale
  // unread count and the inbox badge inflates on refresh. Fires on open AND
  // whenever a new counterpart message lands while the thread is in view.
  // The lastReadServerRef de-dupes so we don't pound the endpoint on every
  // re-render.
  const lastReadServerRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentUserId) return;
    const lastIncoming = [...messages]
      .reverse()
      .find(
        (m) => m.senderId !== currentUserId && !m.id.startsWith("m_local_")
      );
    if (!lastIncoming) return;
    if (lastReadServerRef.current === lastIncoming.id) return;
    lastReadServerRef.current = lastIncoming.id;
    void serverMarkConversationRead(conversation.id, lastIncoming.id).catch(
      () => {
        // Silent — if the read call fails, the local zero-out still keeps the
        // badge accurate for this session. Worst case is a stale badge on the
        // next hard refresh.
      }
    );
  }, [conversation.id, currentUserId, messages]);

  async function handleSend(text: string) {
    const tempId = `m_local_${Date.now()}`;
    const ctxId = pendingContextProductId;
    const optimistic: Message = {
      ...emptyMessageBase(conversation.id, currentUserId),
      id: tempId,
      type: "text",
      content: text,
    };
    addMessage(optimistic);
    if (ctxId) clearPendingContext();
    try {
      const persisted = await sendTextMessage(conversation.id, text, {
        contextProductId: ctxId ?? undefined,
      });
      replaceMessage(conversation.id, tempId, persisted);
    } catch (err) {
      removeMessage(conversation.id, tempId);
      toast.fromApiError("Couldn't send message", err);
    }
  }

  async function handleSendImage(file: File, caption?: string) {
    const tempId = `m_img_${Date.now()}`;
    const ctxId = pendingContextProductId;
    const previewUrl = URL.createObjectURL(file);
    const optimistic: Message = {
      ...emptyMessageBase(conversation.id, currentUserId),
      id: tempId,
      type: "image",
      imageUrl: previewUrl,
      content: caption ?? null,
    };
    addMessage(optimistic);
    if (ctxId) clearPendingContext();
    try {
      const persisted = await sendImageMessage(conversation.id, file, caption, {
        contextProductId: ctxId ?? undefined,
      });
      replaceMessage(conversation.id, tempId, persisted);
    } catch (err) {
      removeMessage(conversation.id, tempId);
      toast.fromApiError("Couldn't send image", err);
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }

  async function handleSendVoice(file: File, durationMs: number) {
    const tempId = `m_voice_${Date.now()}`;
    const ctxId = pendingContextProductId;
    const previewUrl = URL.createObjectURL(file);
    const optimistic: Message = {
      ...emptyMessageBase(conversation.id, currentUserId),
      id: tempId,
      type: "voice",
      voiceUrl: previewUrl,
      voiceDurationMs: durationMs,
      content: null,
    };
    addMessage(optimistic);
    if (ctxId) clearPendingContext();
    try {
      const persisted = await sendVoiceMessage(
        conversation.id,
        file,
        durationMs,
        { contextProductId: ctxId ?? undefined }
      );
      replaceMessage(conversation.id, tempId, persisted);
    } catch (err) {
      removeMessage(conversation.id, tempId);
      toast.fromApiError("Couldn't send voice note", err);
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }

  // Layout chrome around the chat thread differs by perspective + viewport:
  //   buyer    → BuyerTopNav (h-16 = 4rem) at top, BuyerBottomNav (h-16) at bottom on mobile only
  //   seller   → no top nav on desktop; mobile shows a h-14 (3.5rem) header bar
  // The thread height calc and the mobile negative-margin (which neutralises
  // the buyer layout's bottom-tab padding) follow that.
  const heightClass =
    perspective === "buyer"
      ? "h-[calc(100dvh-4rem)]"
      : "h-[calc(100dvh-3.5rem)] md:h-dvh";
  const buyerMobileOffset = perspective === "buyer" ? "-mb-20 md:mb-0" : "";

  return (
    <div
      className={`flex flex-col bg-background ${heightClass} ${buyerMobileOffset}`}
    >
      <ChatHeader
        conversation={conversation}
        perspective={perspective}
        inboxHref={inboxHref}
      />
      <WarningBanner />
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        perspective={perspective}
      />
      <ChatInput
        conversationId={conversation.id}
        perspective={perspective}
        onSend={handleSend}
        onSendImage={handleSendImage}
        onSendVoice={handleSendVoice}
        onInvoiceSent={(message) => addMessage(message)}
      />
    </div>
  );
}
