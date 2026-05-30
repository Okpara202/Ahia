"use client";

import { useEffect } from "react";

import { mapMessage } from "@/lib/services/conversations";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { Message, MessageReaction, Notification } from "@/types";

interface MessagePayload {
  conversationId: string;
  message: unknown;
}

interface MessageDeliveredPayload {
  messageId: string;
  conversationId: string;
  deliveredAt: string;
}

interface MessageReadPayload {
  conversationId: string;
  throughMessageId: string;
  readerId: string;
  readAt: string;
}

interface MessageReactionChangedPayload {
  messageId: string;
  conversationId: string;
  reactions: MessageReaction[];
}

interface NotificationPayload {
  notification: Notification;
}

/**
 * Wire the Socket.io connection while the user is authed. Mounted by
 * StoreHydrator, which lives in both buyer and seller layouts.
 *
 * Chat v1 event surface — see CHAT_V1_BACKEND_SPEC §7 for the full list.
 * Phase 1 handlers: message:new, message:edited, message:reaction_changed,
 * message:delivered, message:read, plus notifications. Invoice + typing
 * events are listened for (and ignored for now) so we don't spam server logs
 * with unhandled-event warnings; their UI lands in Phase 2/3.
 */
export function useSocket() {
  const isAuthed = useAuthStore((s) => s.isAuthed);

  useEffect(() => {
    if (!isAuthed) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();

    function onMessage(p: MessagePayload) {
      const message = mapMessage(p.message);
      useChatStore.getState().addMessage(message);
    }

    function onMessageEdited(p: MessagePayload) {
      const message = mapMessage(p.message);
      useChatStore
        .getState()
        .replaceMessage(p.conversationId, message.id, message);
    }

    function onReactionChanged(p: MessageReactionChangedPayload) {
      const store = useChatStore.getState();
      const list = store.messagesByConversation[p.conversationId];
      if (!list) return;
      const target = list.find((m) => m.id === p.messageId);
      if (!target) return;
      const updated: Message = { ...target, reactions: p.reactions };
      store.replaceMessage(p.conversationId, p.messageId, updated);
    }

    function onDelivered(p: MessageDeliveredPayload) {
      // Update the matching message's deliveredAt — sender side tick state.
      const store = useChatStore.getState();
      const list = store.messagesByConversation[p.conversationId];
      if (!list) return;
      const target = list.find((m) => m.id === p.messageId);
      if (!target) return;
      const updated: Message = { ...target, deliveredAt: p.deliveredAt };
      store.replaceMessage(p.conversationId, p.messageId, updated);
    }

    function onRead(p: MessageReadPayload) {
      // Backend already stamped the reads server-side. Update every message
      // in this conversation up to throughMessageId that we sent (we're the
      // sender, peer is the reader) and that doesn't already have readAt.
      const store = useChatStore.getState();
      const list = store.messagesByConversation[p.conversationId];
      if (!list) return;
      let hit = false;
      const updates: Array<{ id: string; updated: Message }> = [];
      for (const m of list) {
        if (m.readAt) continue;
        if (m.senderId === p.readerId) continue;
        updates.push({ id: m.id, updated: { ...m, readAt: p.readAt } });
        if (m.id === p.throughMessageId) {
          hit = true;
          break;
        }
      }
      if (!hit && updates.length === 0) return;
      for (const u of updates) {
        store.replaceMessage(p.conversationId, u.id, u.updated);
      }
    }

    function onNotification(p: NotificationPayload) {
      useNotificationStore.getState().add(p.notification);
    }

    socket.on("message:new", onMessage);
    socket.on("message:edited", onMessageEdited);
    socket.on("message:reaction_changed", onReactionChanged);
    socket.on("message:delivered", onDelivered);
    socket.on("message:read", onRead);
    socket.on("image:new", onMessage);
    socket.on("notification:new", onNotification);

    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:edited", onMessageEdited);
      socket.off("message:reaction_changed", onReactionChanged);
      socket.off("message:delivered", onDelivered);
      socket.off("message:read", onRead);
      socket.off("image:new", onMessage);
      socket.off("notification:new", onNotification);
    };
  }, [isAuthed]);
}
