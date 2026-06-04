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

/** Hook variant — read-only access for a specific user with a sane default
 *  when we haven't seen any presence event for them yet. */
export function useUserPresence(userId: string | undefined): PresenceEntry {
  return usePresenceStore((s) =>
    userId ? s.byUserId[userId] ?? { online: false, lastSeenAt: null } : { online: false, lastSeenAt: null }
  );
}
