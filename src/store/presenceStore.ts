import { create } from "zustand";

interface PresenceEntry {
  online: boolean;
  lastSeenAt: string | null;
}

interface PresenceState {
  /** userId → presence. Populated by socket events + first-paint
   *  /users/:id/presence lookups. */
  byUserId: Record<string, PresenceEntry>;
  setPresence: (
    userId: string,
    online: boolean,
    lastSeenAt: string | null
  ) => void;
  /** Bulk merge — used when we receive a list with isOnline already
   *  flattened on each row (FollowingShop, ShopFollower). */
  merge: (entries: Array<{ userId: string; online: boolean }>) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  byUserId: {},
  setPresence: (userId, online, lastSeenAt) =>
    set((state) => ({
      byUserId: {
        ...state.byUserId,
        [userId]: { online, lastSeenAt },
      },
    })),
  merge: (entries) =>
    set((state) => {
      const next = { ...state.byUserId };
      for (const e of entries) {
        next[e.userId] = {
          online: e.online,
          lastSeenAt: next[e.userId]?.lastSeenAt ?? null,
        };
      }
      return { byUserId: next };
    }),
}));

/** Stable "offline" default. Must be a module-level singleton (not an
 *  inline object literal) so the zustand selector returns the SAME
 *  reference every call when we have no presence for this user. A fresh
 *  object would trip Object.is identity, force a re-render, run the
 *  selector again, return another fresh object — infinite loop. */
const OFFLINE: PresenceEntry = { online: false, lastSeenAt: null };

/** Hook variant — read-only access for a specific user with a sane default
 *  when we haven't seen any presence event for them yet. */
export function useUserPresence(userId: string | undefined): PresenceEntry {
  return usePresenceStore((s) =>
    userId ? s.byUserId[userId] ?? OFFLINE : OFFLINE
  );
}
