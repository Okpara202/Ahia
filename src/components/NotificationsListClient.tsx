"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { EmptyNotificationsIllustration } from "@/components/illustrations";
import { Typography } from "@/components/Typography";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/lib/services/notifications";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { Notification } from "@/types";

interface NotificationsListClientProps {
  /** "Notifications" — page title above the list. */
  title: string;
  /** Copy under the empty-state illustration. */
  emptyHint: string;
  /** Per-perspective row renderer (buyer uses NotificationItem, seller uses
   *  NotificationRow). */
  renderRow: (notification: Notification) => React.ReactNode;
}

/**
 * Client-side notifications list. Server components can't see the backend
 * session cookie cross-origin (see CLAUDE.md §11c), so SSR-fetching
 * notifications returns empty arrays even for signed-in users. This client
 * loader fetches in the browser where the cookie rides along.
 *
 * Reads from `notificationStore` for live socket-pushed updates while the
 * page is open. Marks all as read on mount so the bell badge clears.
 */
export function NotificationsListClient({
  title,
  emptyHint,
  renderRow,
}: NotificationsListClientProps) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    if (!authReady || !isAuthed) return;
    let cancelled = false;
    void getNotifications()
      .then((fresh) => {
        if (cancelled) return;
        useNotificationStore.getState().setItems(fresh);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [authReady, isAuthed]);

  // Once the list has rendered (and the user has seen the items), mark them
  // all read server-side so the bell badge clears across devices. The local
  // store is zeroed optimistically.
  useEffect(() => {
    if (!authReady || !isAuthed) return;
    if (unreadCount === 0) return;
    useNotificationStore.getState().markAllRead();
    void markAllNotificationsRead().catch(() => undefined);
  }, [authReady, isAuthed, unreadCount]);

  if (!authReady) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <Typography variant="heading-h1">{title}</Typography>
        {unreadCount > 0 && (
          <Typography variant="label-md" className="text-primary">
            {unreadCount} unread
          </Typography>
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
          <EmptyNotificationsIllustration className="size-32 text-primary/40" />
          <Typography variant="heading-h4">All caught up</Typography>
          <Typography variant="body-sm" className="max-w-xs text-muted-foreground">
            {emptyHint}
          </Typography>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n.id}>{renderRow(n)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
