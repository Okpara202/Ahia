"use client";

import { useEffect } from "react";

import {
  extractApiError,
} from "@/lib/api";
import {
  sendImageMessage,
  sendOffer,
  sendTextMessage,
} from "@/lib/services/conversations";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { toast } from "@/store/toastStore";
import type { Conversation, Message } from "@/types";
import { ChatHeader, type ChatPerspective } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { WarningBanner } from "./WarningBanner";

interface ChatThreadProps {
  conversation: Conversation;
  initialMessages: Message[];
  perspective: ChatPerspective;
  inboxHref: string;
}

export function ChatThread({
  conversation,
  initialMessages,
  perspective,
  inboxHref,
}: ChatThreadProps) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? "");
  const messagesInStore = useChatStore(
    (s) => s.messagesByConversation[conversation.id]
  );
  const addMessage = useChatStore((s) => s.addMessage);
  const replaceMessage = useChatStore((s) => s.replaceMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);

  useEffect(() => {
    const store = useChatStore.getState();
    if (!store.messagesByConversation[conversation.id]) {
      store.setMessages(conversation.id, initialMessages);
    }
    store.markConversationRead(conversation.id);
  }, [conversation.id, initialMessages]);

  const messages = messagesInStore ?? initialMessages;

  async function handleSend(text: string) {
    const tempId = `m_local_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUserId,
      type: "text",
      content: text,
      createdAt: new Date().toISOString(),
    };
    addMessage(optimistic);
    try {
      const persisted = await sendTextMessage(conversation.id, text);
      replaceMessage(conversation.id, tempId, persisted);
    } catch (err) {
      removeMessage(conversation.id, tempId);
      toast.error(
        "Couldn't send message",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    }
  }

  async function handleSendOffer(amount: number, note?: string) {
    const tempId = `m_offer_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUserId,
      type: "offer",
      amount,
      status: "pending",
      note,
      createdAt: new Date().toISOString(),
    };
    addMessage(optimistic);
    try {
      const persisted = await sendOffer(conversation.id, amount, note);
      replaceMessage(conversation.id, tempId, persisted);
    } catch (err) {
      removeMessage(conversation.id, tempId);
      toast.error(
        "Couldn't send offer",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    }
  }

  async function handleSendImage(file: File, caption?: string) {
    const tempId = `m_img_${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    const optimistic: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUserId,
      type: "image",
      url: previewUrl,
      caption,
      createdAt: new Date().toISOString(),
    };
    addMessage(optimistic);
    try {
      const persisted = await sendImageMessage(conversation.id, file, caption);
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
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        productId={conversation.product.id}
      />
      <ChatInput
        onSend={handleSend}
        onSendOffer={handleSendOffer}
        onSendImage={handleSendImage}
      />
    </div>
  );
}
