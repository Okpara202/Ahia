"use server";

import { getApi } from "@/lib/api";
import type { Review } from "@/types";

interface SubmitReviewArgs {
  transactionId: string;
  productId: string;
  shopId: string;
  rating: number;
  body?: string;
}

/**
 * Persist a buyer's review of a completed transaction. One review per
 * transaction (enforced server-side via UNIQUE on transaction_id).
 */
export async function submitReview(
  args: SubmitReviewArgs
): Promise<{ review: Review }> {
  const api = await getApi();
  const { data } = await api.post<{ review: Review }>("/reviews", {
    transactionId: args.transactionId,
    productId: args.productId,
    shopId: args.shopId,
    rating: args.rating,
    body: args.body?.trim() || undefined,
  });
  return { review: data.review };
}
