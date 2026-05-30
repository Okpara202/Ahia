import { create } from "zustand";

import type { ConversationListItem, Message } from "@/types";

/**
 * Build an inbox-row snippet for an optimistic local message. The server
 * always sends a pre-rendered snippet on the conversation list response,
 * but optimistic local messages need their own preview until the server
 * echo arrives.
 */
function localSnippet(message: Message): string {
  switch (message.type) {
    case "text":
      return message.content.slice(0, 80);
    case "voice":
      return `🎤 Voice`;
    case "image":
      return message.content ? `📷 ${message.content}` : "📷 Photo";
    case "invoice":
      return `🧾 Invoice ₦${Number(message.invoice.totalAmount).toLocaleString("en-NG")}`;
    case "system":
      return message.content;
  }
}

interface ChatState {
  conversations: ConversationListItem[];
  /** Messages keyed by conversationId. */
  messagesByConversation: Record<string, Message[]>;
  /** Conversation ids whose thread is currently open in a tab — used by
   *  notification handlers to skip badge updates for the active chat. */
  openConversationIds: string[];
  unreadCount: number;

  setConversations: (items: ConversationListItem[]) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  /** Replace a message in-place (used to swap optimistic → persisted, or
   *  apply an edit / reaction update). */
  replaceMessage: (
    conversationId: string,
    messageId: string,
    updated: Message
  ) => void;
  /** Drop a message by id — used to roll back optimistic sends on failure. */
  removeMessage: (conversationId: string, messageId: string) => void;
  /** Zero the unreadCount for a conversation. The server-side mark-read
   *  call is fired by the chat page when it opens. */
  markConversationRead: (id: string) => void;
  openConversation: (id: string) => void;
  closeConversation: (id: string) => void;
}

const computeTotalUnread = (list: ConversationListItem[]) =>
  list.reduce((n, c) => n + c.unreadCount, 0);

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messagesByConversation: {},
  openConversationIds: [],
  unreadCount: 0,

  setConversations: (conversations) =>
    set({ conversations, unreadCount: computeTotalUnread(conversations) }),

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
      // Idempotent on id: backend echoes `message:new` to the sender too, so
      // after an optimistic send + REST replace, the socket echo would append
      // a duplicate without this check. If we already have this id, replace
      // it in place; otherwise append. Also handles the case where multiple
      // events (`message:new` + `image:new` / `invoice:created`) target the
      // same message.
      const existingIndex = prev.findIndex((m) => m.id === message.id);
      const nextList =
        existingIndex >= 0
          ? prev.map((m, i) => (i === existingIndex ? message : m))
          : [...prev, message];
      const messagesByConversation = {
        ...state.messagesByConversation,
        [message.conversationId]: nextList,
      };
      // Bump the matching inbox row's snippet + lastActivityAt locally so
      // the list updates immediately. Server echoes the same on next list
      // fetch with a properly rendered snippet. Skip the unread bump when
      // we already had this id — that's a socket echo of our own send.
      const isOpen = state.openConversationIds.includes(
        message.conversationId
      );
      const isEcho = existingIndex >= 0;
      const conversations = state.conversations.map((c) => {
        if (c.id !== message.conversationId) return c;
        const counterpartyIsSender = c.counterparty.id === message.senderId;
        return {
          ...c,
          lastMessage: {
            id: message.id,
            type: message.type,
            snippet: localSnippet(message),
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
          lastActivityAt: message.createdAt,
          unreadCount:
            !isEcho && counterpartyIsSender && !isOpen
              ? c.unreadCount + 1
              : c.unreadCount,
        };
      });
      return {
        messagesByConversation,
        conversations,
        unreadCount: computeTotalUnread(conversations),
      };
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
        c.id === id ? { ...c, unreadCount: 0 } : c
      );
      return {
        conversations,
        unreadCount: computeTotalUnread(conversations),
      };
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
