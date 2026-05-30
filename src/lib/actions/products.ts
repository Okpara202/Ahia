"use server";

import { getApi } from "@/lib/api";

/**
 * Toggle a product's `hidden` flag. "Hide" keeps the row + chat/transaction
 * references intact but pulls it from feed/search/storefront per the
 * BACKEND_HANDOFF.md §2 contract.
 */
export async function setProductVisibility(
  productId: string,
  hidden: boolean
): Promise<void> {
  const api = await getApi();
  await api.patch(`/products/${productId}/visibility`, { hidden });
}

/**
 * Soft-delete a product. Backend sets `deleted_at` so disputes can still
 * reference the listing.
 */
export async function deleteProduct(productId: string): Promise<void> {
  const api = await getApi();
  await api.delete(`/products/${productId}`);
}
