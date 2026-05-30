import axios from "axios";

import { getApi } from "@/lib/api";
import type { Notification, NotificationType } from "@/types";

function mapNotification(raw: unknown): Notification {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id),
    type: r.type as NotificationType,
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    read: Boolean(r.read ?? false),
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    link: (r.link as string | undefined) ?? undefined,
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
