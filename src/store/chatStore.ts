import { create } from "zustand";

import type { Conversation, Message } from "@/types";

function previewFor(message: Message): string {
  switch (message.type) {
    case "text":
      return message.content;
    case "payment_request":
      return `Payment request • ₦${message.amount.toLocaleString("en-NG")}`;
    case "system":
      return message.content;
    case "offer":
      return `Offer • ₦${message.amount.toLocaleString("en-NG")}`;
    case "image":
      return message.caption ? `📷 ${message.caption}` : "📷 Photo";
  }
}

interface ChatState {
  conversations: Conversation[];
  /** messages keyed by conversationId */
  messagesByConversation: Record<string, Message[]>;
  /** ids of conversations whose chat thread is currently open in a tab */
  openConversationIds: string[];
  unreadCount: number;

  setConversations: (conversations: Conversation[]) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  /** Replace a message in-place (used to update offer status, etc.). */
  replaceMessage: (
    conversationId: string,
    messageId: string,
    updated: Message
  ) => void;
  /** Drop a message by id — used to roll back optimistic sends on failure. */
  removeMessage: (conversationId: string, messageId: string) => void;
  markConversationRead: (id: string) => void;
  openConversation: (id: string) => void;
  closeConversation: (id: string) => void;
}

const computeUnread = (conversations: Conversation[]) =>
  conversations.reduce((n, c) => n + (c.unread ? 1 : 0), 0);

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messagesByConversation: {},
  openConversationIds: [],
  unreadCount: 0,

  setConversations: (conversations) =>
    set({ conversations, unreadCount: computeUnread(conversations) }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: messages,
      },
    })),

  addMessage: (message) =>
    set((state) => {
      const prev = state.messagesByConversation[message.conversationId] ?? [];
      const messagesByConversation = {
        ...state.messagesByConversation,
        [message.conversationId]: [...prev, message],
      };
      const conversations = state.conversations.map((c) =>
        c.id === message.conversationId
          ? {
              ...c,
              lastMessage: previewFor(message),
              lastMessageAt: message.createdAt,
            }
          : c
      );
      return { messagesByConversation, conversations };
    }),

  replaceMessage: (conversationId, messageId, updated) =>
    set((state) => {
      const prev = state.messagesByConversation[conversationId];
      if (!prev) return state;
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: prev.map((m) => (m.id === messageId ? updated : m)),
        },
      };
    }),

  removeMessage: (conversationId, messageId) =>
    set((state) => {
      const prev = state.messagesByConversation[conversationId];
      if (!prev) return state;
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: prev.filter((m) => m.id !== messageId),
        },
      };
    }),

  markConversationRead: (id) =>
    set((state) => {
      const conversations = state.conversations.map((c) =>
        c.id === id ? { ...c, unread: false } : c
      );
      return { conversations, unreadCount: computeUnread(conversations) };
    }),

  openConversation: (id) =>
    set((state) =>
      state.openConversationIds.includes(id)
        ? state
        : { openConversationIds: [...state.openConversationIds, id] }
    ),

  closeConversation: (id) =>
    set((state) => ({
      openConversationIds: state.openConversationIds.filter((x) => x !== id),
    })),
}));
