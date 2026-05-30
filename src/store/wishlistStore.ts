import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  addToWishlist,
  removeFromWishlist,
} from "@/lib/services/wishlist";
import { useAuthStore } from "@/store/authStore";

interface WishlistState {
  /** Set of product IDs the buyer has saved. */
  ids: string[];
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => boolean;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  /** Replace the entire set — used by `useWishlistSync` to seed from the
   *  server on sign-in. */
  setIds: (ids: string[]) => void;
  clear: () => void;
}

/** Strip pagination suffixes so saving `p_01_p2_5` and `p_01_p0_0` saves the
 * same underlying product just once. */
function baseId(productId: string): string {
  return productId.match(/^([a-z]+_\d+)/i)?.[1] ?? productId;
}

/** Fire-and-forget — never block UI on the server sync. Failures stay local. */
function syncAdd(id: string) {
  if (!useAuthStore.getState().isAuthed) return;
  addToWishlist(id).catch(() => undefined);
}

function syncRemove(id: string) {
  if (!useAuthStore.getState().isAuthed) return;
  removeFromWishlist(id).catch(() => undefined);
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      isSaved: (productId) => get().ids.includes(baseId(productId)),
      toggle: (productId) => {
        const id = baseId(productId);
        const present = get().ids.includes(id);
        set((s) => ({
          ids: present ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        }));
        if (present) syncRemove(id);
        else syncAdd(id);
        return !present;
      },
      add: (productId) => {
        const id = baseId(productId);
        if (get().ids.includes(id)) return;
        set((s) => ({ ids: [...s.ids, id] }));
        syncAdd(id);
      },
      remove: (productId) => {
        const id = baseId(productId);
        if (!get().ids.includes(id)) return;
        set((s) => ({ ids: s.ids.filter((x) => x !== id) }));
        syncRemove(id);
      },
      setIds: (ids) => set({ ids: [...new Set(ids.map(baseId))] }),
      clear: () => set({ ids: [] }),
    }),
    {
      name: "ahia-wishlist",
      partialize: (s) => ({ ids: s.ids }),
    }
  )
);
