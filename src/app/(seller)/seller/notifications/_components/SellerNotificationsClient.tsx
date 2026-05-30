"use client";

import { NotificationsListClient } from "@/components/NotificationsListClient";
import { NotificationRow } from "./NotificationRow";

/**
 * Tiny client wrapper that owns the `renderRow` function — kept here so the
 * server page never has to pass a function prop across the server/client
 * boundary (Next.js App Router forbids that unless the function is a server
 * action).
 */
export function SellerNotificationsClient() {
  return (
    <NotificationsListClient
      title="Notifications"
      emptyHint="Payments, messages, and dispute updates will show up here."
      renderRow={(n) => <NotificationRow notification={n} />}
    />
  );
}
