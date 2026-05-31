import { create } from "zustand";

import type { Notification } from "@/types";

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  setItems: (items: Notification[]) => void;
  add: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Optimistically remove a notification from the list — used right after
   *  the user taps × on a row, before the DELETE request completes. */
  remove: (id: string) => void;
}

const computeUnread = (items: Notification[]) =>
  items.reduce((n, it) => n + (it.read ? 0 : 1), 0);

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  setItems: (items) => set({ items, unreadCount: computeUnread(items) }),
  add: (notification) =>
    set((state) => {
      const items = [notification, ...state.items];
      return { items, unreadCount: computeUnread(items) };
    }),
  markRead: (id) =>
    set((state) => {
      const items = state.items.map((it) =>
        it.id === id ? { ...it, read: true } : it
      );
      return { items, unreadCount: computeUnread(items) };
    }),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((it) => ({ ...it, read: true })),
      unreadCount: 0,
    })),
  remove: (id) =>
    set((state) => {
      const items = state.items.filter((it) => it.id !== id);
      return { items, unreadCount: computeUnread(items) };
    }),
}));
