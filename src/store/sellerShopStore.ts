import { create } from "zustand";

import type { Shop } from "@/types";

interface SellerShopState {
  /** The signed-in user's shop, set by `SellerShellGate` after a successful
   *  `/shops/me` fetch. Null means no shop yet (brand-new seller) or the
   *  shop hasn't been hydrated yet. Inner seller pages read from this
   *  instead of refetching, since SSR can't see the backend cookie
   *  cross-origin.
   *
   *  Not persisted — re-hydrated from the network on every page load. */
  shop: Shop | null;
  setShop: (shop: Shop | null) => void;
  /** Patch fields on the current shop without replacing the whole record.
   *  No-op when shop is null. Useful after `PATCH /shops/me` returns the
   *  updated fields. */
  patchShop: (partial: Partial<Shop>) => void;
}

export const useSellerShopStore = create<SellerShopState>()((set) => ({
  shop: null,
  setShop: (shop) => set({ shop }),
  patchShop: (partial) =>
    set((s) => ({ shop: s.shop ? { ...s.shop, ...partial } : s.shop })),
}));
