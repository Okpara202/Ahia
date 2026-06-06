"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";

import { mapMessage } from "@/lib/services/conversations";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";
import { usePresenceStore } from "@/store/presenceStore";
import type {
  Invoice,
  InvoiceStatus,
  Message,
  MessageReaction,
  Notification,
} from "@/types";

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

interface PresenceChangedPayload {
  userId: string;
  online: boolean;
  lastSeenAt?: string;
}

interface InvoiceStatusOnlyPayload {
  invoiceId: string;
  conversationId: string;
}

interface InvoiceLineStatusPayload {
  lineId: string;
  invoiceId: string;
  conversationId: string;
  invoiceStatus?: InvoiceStatus;
  autoReleased?: boolean;
  disputeId?: string;
}

interface InvoiceLineExtendedPayload {
  lineId: string;
  invoiceId: string;
  conversationId: string;
  autoReleaseAt: string;
  extendedAt: string;
  extensionReason: string;
}

/**
 * Wire the Socket.io connection while the user is authed. Mounted by
 * StoreHydrator, which lives in both buyer and seller layouts.
 *
 * Chat v1 event surface — see CHAT_V1_BACKEND_SPEC §7 and backend's
 * 2026-05-30 reply for the canonical event names.
 */
export function useSocket() {
  const isAuthed = useAuthStore((s) => s.isAuthed);

  useEffect(() => {
    if (!isAuthed) {
      disconnectSocket();
      return;
    }

    // socket.io-client is dynamically imported by getSocket() so it doesn't
    // ship in the initial bundle for unauthed surfaces. Resolution is async;
    // track cancellation so a sign-out before the import resolves doesn't
    // attach orphan listeners.
    let cancelled = false;
    let socket: Socket | null = null;
    let heartbeatId: number | null = null;

    /* ---------------- helpers ---------------- */

    /** Locate an invoice message in the store by invoiceId. */
    function findInvoiceMessage(
      conversationId: string,
      invoiceId: string
    ): (Message & { type: "invoice" }) | null {
      const list =
        useChatStore.getState().messagesByConversation[conversationId];
      if (!list) return null;
      for (const m of list) {
        if (m.type === "invoice" && m.invoice.id === invoiceId) return m;
      }
      return null;
    }

    /** Replace the invoice on a message in-place. */
    function patchInvoice(
      conversationId: string,
      invoiceId: string,
      update: (current: Invoice) => Invoice
    ) {
      const target = findInvoiceMessage(conversationId, invoiceId);
      if (!target) return;
      useChatStore.getState().replaceMessage(conversationId, target.id, {
        ...target,
        invoice: update(target.invoice),
      });
    }

    /* ---------------- handlers ---------------- */

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
      const store = useChatStore.getState();
      const list = store.messagesByConversation[p.conversationId];
      if (!list) return;
      const target = list.find((m) => m.id === p.messageId);
      if (!target) return;
      const updated: Message = { ...target, deliveredAt: p.deliveredAt };
      store.replaceMessage(p.conversationId, p.messageId, updated);
    }

    function onRead(p: MessageReadPayload) {
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

    function onPresenceChanged(p: PresenceChangedPayload) {
      usePresenceStore
        .getState()
        .setPresence(p.userId, p.online, p.lastSeenAt ?? null);
    }

    /* ----- invoice events ----- */

    function onInvoiceCancelled(p: InvoiceStatusOnlyPayload) {
      patchInvoice(p.conversationId, p.invoiceId, (inv) => ({
        ...inv,
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      }));
    }

    function onInvoicePaid(p: InvoiceStatusOnlyPayload & { paidAt?: string }) {
      patchInvoice(p.conversationId, p.invoiceId, (inv) => ({
        ...inv,
        status: "paid",
        paidAt: p.paidAt ?? new Date().toISOString(),
      }));
    }

    function onLineConfirmed(p: InvoiceLineStatusPayload) {
      patchInvoice(p.conversationId, p.invoiceId, (inv) => {
        const lines = inv.lines.map((l) =>
          l.id === p.lineId
            ? {
                ...l,
                status: "released" as const,
                resolvedAt: new Date().toISOString(),
                autoReleaseAt: null,
              }
            : l
        );
        return {
          ...inv,
          status: p.invoiceStatus ?? inv.status,
          lines,
        };
      });
    }

    function onLineDisputed(p: InvoiceLineStatusPayload) {
      patchInvoice(p.conversationId, p.invoiceId, (inv) => {
        const lines = inv.lines.map((l) =>
          l.id === p.lineId ? { ...l, autoReleaseAt: null } : l
        );
        return { ...inv, lines };
      });
    }

    function onLineRefunded(p: InvoiceLineStatusPayload) {
      patchInvoice(p.conversationId, p.invoiceId, (inv) => {
        const lines = inv.lines.map((l) =>
          l.id === p.lineId
            ? {
                ...l,
                status: "refunded" as const,
                resolvedAt: new Date().toISOString(),
                autoReleaseAt: null,
              }
            : l
        );
        return {
          ...inv,
          status: p.invoiceStatus ?? inv.status,
          lines,
        };
      });
    }

    function onLineReleasedByAdmin(p: InvoiceLineStatusPayload) {
      // Admin sided with seller — same shape as buyer-confirm.
      onLineConfirmed(p);
    }

    function onLineExtended(p: InvoiceLineExtendedPayload) {
      patchInvoice(p.conversationId, p.invoiceId, (inv) => {
        const lines = inv.lines.map((l) =>
          l.id === p.lineId
            ? {
                ...l,
                autoReleaseAt: p.autoReleaseAt,
                extendedAt: p.extendedAt,
                extensionReason: p.extensionReason,
              }
            : l
        );
        return { ...inv, lines };
      });
    }

    function onInvoiceCreated(p: MessagePayload) {
      // Backend emits this AND message:new. message:new handler already adds
      // the message; if this fires first/only, ensure the invoice message
      // lands too. addMessage is idempotent at the id level (replace would
      // dedupe), but addMessage isn't. Use replaceMessage if it already
      // exists, else add.
      const message = mapMessage(p.message);
      const store = useChatStore.getState();
      const list = store.messagesByConversation[p.conversationId];
      if (list?.some((m) => m.id === message.id)) {
        store.replaceMessage(p.conversationId, message.id, message);
      } else {
        store.addMessage(message);
      }
    }

    /* ---------------- wire up (after async import resolves) ---------------- */

    getSocket().then((s) => {
      if (cancelled) return;
      socket = s;
      s.on("message:new", onMessage);
      s.on("message:edited", onMessageEdited);
      s.on("message:reaction_changed", onReactionChanged);
      s.on("message:delivered", onDelivered);
      s.on("message:read", onRead);
      s.on("image:new", onMessage);
      s.on("notification:new", onNotification);
      s.on("invoice:created", onInvoiceCreated);
      s.on("invoice:cancelled", onInvoiceCancelled);
      s.on("invoice:paid", onInvoicePaid);
      s.on("invoice:line_confirmed", onLineConfirmed);
      s.on("invoice:line_disputed", onLineDisputed);
      s.on("invoice:line_extended", onLineExtended);
      s.on("invoice:line_released", onLineReleasedByAdmin);
      s.on("invoice:line_refunded", onLineRefunded);
      s.on("presence:changed", onPresenceChanged);

      // Heartbeat so backend's TTL doesn't expire while the tab is open.
      heartbeatId = window.setInterval(() => {
        s.emit("heartbeat");
      }, 20_000);
    });

    return () => {
      cancelled = true;
      if (heartbeatId !== null) window.clearInterval(heartbeatId);
      if (!socket) return;
      socket.off("message:new", onMessage);
      socket.off("message:edited", onMessageEdited);
      socket.off("message:reaction_changed", onReactionChanged);
      socket.off("message:delivered", onDelivered);
      socket.off("message:read", onRead);
      socket.off("image:new", onMessage);
      socket.off("notification:new", onNotification);
      socket.off("invoice:created", onInvoiceCreated);
      socket.off("invoice:cancelled", onInvoiceCancelled);
      socket.off("invoice:paid", onInvoicePaid);
      socket.off("invoice:line_confirmed", onLineConfirmed);
      socket.off("invoice:line_disputed", onLineDisputed);
      socket.off("invoice:line_extended", onLineExtended);
      socket.off("invoice:line_released", onLineReleasedByAdmin);
      socket.off("invoice:line_refunded", onLineRefunded);
      socket.off("presence:changed", onPresenceChanged);
    };
  }, [isAuthed]);
}

