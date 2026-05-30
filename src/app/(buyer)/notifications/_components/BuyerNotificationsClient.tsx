"use client";

import { NotificationsListClient } from "@/components/NotificationsListClient";
import { NotificationItem } from "./NotificationItem";

/**
 * Tiny client wrapper that owns the `renderRow` function — kept here so the
 * server page never has to pass a function prop across the server/client
 * boundary (Next.js App Router forbids that unless the function is a server
 * action).
 */
export function BuyerNotificationsClient() {
  return (
    <NotificationsListClient
      title="Notifications"
      emptyHint="New payments, messages, and updates will show up here."
      renderRow={(n) => <NotificationItem notification={n} />}
    />
  );
}
