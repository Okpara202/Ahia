"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { extractApiError } from "@/lib/api";
import {
  sendImageMessage,
  sendTextMessage,
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
      toast.error(
        "Couldn't send message",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
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
      toast.error(
        "Couldn't send image",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }

  return (
    <div className="-mb-20 flex h-[calc(100dvh-4rem)] flex-col bg-background md:mb-0">
      <ChatHeader
        conversation={conversation}
        perspective={perspective}
        inboxHref={inboxHref}
      />
      <WarningBanner />
      <MessageList messages={messages} currentUserId={currentUserId} />
      <ChatInput onSend={handleSend} onSendImage={handleSendImage} />
    </div>
  );
}
