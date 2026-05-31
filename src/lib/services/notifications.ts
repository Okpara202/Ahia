import axios from "axios";

import { getApi } from "@/lib/api";
import type { Notification, NotificationType } from "@/types";

function mapNotification(raw: unknown): Notification {
  const r = raw as Record<string, unknown>;
  // Backend's `readAt` is null until the user marks read; we expose as a
  // boolean for the UI. Same with `archivedAt`.
  const readAt = r.readAt ?? r.read;
  const read =
    typeof readAt === "boolean" ? readAt : typeof readAt === "string";
  return {
    id: String(r.id),
    type: r.type as NotificationType,
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    read,
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    link: (r.link as string | undefined) ?? undefined,
    archivedAt:
      typeof r.archivedAt === "string" ? r.archivedAt : null,
  };
}

export async function getNotifications(): Promise<Notification[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      items?: unknown[];
      notifications?: unknown[];
    }>("/notifications");
    return ((data.items ?? data.notifications) ?? []).map(mapNotification);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return [];
    throw err;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  const api = await getApi();
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const api = await getApi();
  await api.patch("/notifications/read-all");
}

/** Soft-delete (archive) a notification. Backend marks it archived and
 *  excludes from subsequent list responses. 204 No Content on success and
 *  on no-op (already archived / wrong user). */
export async function archiveNotification(id: string): Promise<void> {
  const api = await getApi();
  await api.delete(`/notifications/${id}`);
}
