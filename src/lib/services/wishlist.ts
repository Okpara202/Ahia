import axios from "axios";

import { apiClient, getApi } from "@/lib/api";

/**
 * Cross-device wishlist. The client store uses these to mirror state to
 * the server whenever the user is signed in. Guests stay local-only via
 * the persisted Zustand store; on first sign-in, `mergeWishlist` flushes
 * the local set to the server.
 */
export async function getWishlist(): Promise<string[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ items?: { productId: string }[] }>(
      "/wishlist"
    );
    return (data.items ?? []).map((it) => it.productId);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return [];
    throw err;
  }
}

export async function addToWishlist(productId: string): Promise<void> {
  await apiClient().post("/wishlist", { productId });
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiClient().delete(`/wishlist/${productId}`);
}

/**
 * Push every id in `localIds` to the backend wishlist; ignore individual
 * failures (already-saved entries return 409 which is fine).
 */
export async function mergeWishlist(localIds: string[]): Promise<void> {
  if (localIds.length === 0) return;
  await Promise.allSettled(localIds.map((id) => addToWishlist(id)));
}
