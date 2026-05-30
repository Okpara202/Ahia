"use client";

import { useEffect } from "react";

import { mapMessage } from "@/lib/services/conversations";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { Message, Notification } from "@/types";

interface MessagePayload {
  message: unknown;
}

interface OfferResolvedPayload {
  conversationId: string;
  message: unknown;
}

interface NotificationPayload {
  notification: Notification;
}

/**
 * Wire the Socket.io connection while the user is authed. Mount this once
 * — StoreHydrator does so since it's already present in both buyer and
 * seller layouts.
 *
 * Listener set is locked to what the backend actually emits per the latest
 * handoff. Notably absent: `payment_request:new` (v1 backend doesn't use
 * that flow; the offer/accept → buyer Pay button path covers negotiated
 * checkout). Transaction state events (`transaction:paid` etc.) are real
 * but not wired here — the notification row they spawn lands via
 * `notification:new`, which is what the user sees.
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
      const message = mapMessage(p.message) as Message;
      useChatStore.getState().addMessage(message);
    }

    function onOfferResolved(p: OfferResolvedPayload) {
      const message = mapMessage(p.message) as Message;
      useChatStore
        .getState()
        .replaceMessage(p.conversationId, message.id, message);
    }

    function onNotification(p: NotificationPayload) {
      useNotificationStore.getState().add(p.notification);
    }

    socket.on("message:new", onMessage);
    socket.on("offer:new", onMessage);
    socket.on("offer:resolved", onOfferResolved);
    socket.on("notification:new", onNotification);

    return () => {
      socket.off("message:new", onMessage);
      socket.off("offer:new", onMessage);
      socket.off("offer:resolved", onOfferResolved);
      socket.off("notification:new", onNotification);
    };
  }, [isAuthed]);
}
