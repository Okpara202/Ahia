"use client";

import { useEffect, useState } from "react";

import { useWishlistStore } from "@/store/wishlistStore";

/**
 * Hydration-safe wrapper around `useWishlistStore.isSaved`.
 *
 * The wishlist is persisted to localStorage via zustand's `persist` middleware
 * — which means the server has no idea what's saved, but the client reads
 * the persisted state on hydration. That mismatch crashes React's hydration
 * check (the bookmark icon would be filled on client but unfilled on server).
 *
 * This hook returns `false` during SSR and the very first client render, then
 * flips to the real persisted state after `useEffect` fires. So the first
 * paint matches the server's HTML; the second paint reflects the saved
 * state. No flicker for unsaved products; one frame of "Save for later" →
 * "Saved" on already-saved ones, which is acceptable.
 */
export function useIsSaved(productId: string): boolean {
  const [mounted, setMounted] = useState(false);
  const saved = useWishlistStore((s) => s.isSaved(productId));

  useEffect(() => {
    // Intentional set-state-in-effect: the whole point is to flip a flag on
    // mount so the second render reflects the persisted client state. The
    // rule's "cascading renders" warning doesn't apply — this is exactly one
    // extra render, by design, to keep hydration consistent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted && saved;
}
