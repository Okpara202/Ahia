import axios from "axios";

import { getApi } from "@/lib/api";

export interface Presence {
  online: boolean;
  lastSeenAt: string | null;
}

/**
 * Get the live presence of a single user — used for first-paint when the
 * `presence:changed` socket event hasn't reached us yet. Phase 7 endpoint;
 * 404 returns the safe default (offline, no last-seen) so consumers don't
 * crash before backend ships.
 */
export async function getUserPresence(userId: string): Promise<Presence> {
  const api = await getApi();
  try {
    const { data } = await api.get<Presence>(`/users/${userId}/presence`);
    return {
      online: Boolean(data.online),
      lastSeenAt: data.lastSeenAt ?? null,
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return { online: false, lastSeenAt: null };
    }
    throw err;
  }
}
