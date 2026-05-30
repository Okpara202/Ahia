import axios from "axios";

import { getApi } from "@/lib/api";
import { MOCK_REVIEWS } from "@/lib/mocks/reviews";
import type { Review } from "@/types";

export interface ProductReviews {
  reviews: Review[];
  average: number;
  count: number;
}

function mapReview(raw: unknown): Review {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id),
    productId: String(r.productId ?? ""),
    shopId: String(r.shopId ?? ""),
    transactionId: String(r.transactionId ?? ""),
    authorId: String(r.authorId ?? ""),
    authorName: String(r.authorName ?? ""),
    rating: Number(r.rating ?? 0),
    body: (r.body as string | undefined) ?? undefined,
    createdAt: String(r.createdAt ?? new Date().toISOString()),
  };
}

/**
 * Get reviews for a product, plus the aggregate score.
 * Backend returns the aggregate inline so the UI gets count/average in one
 * round-trip.
 */
export async function getProductReviews(
  productId: string
): Promise<ProductReviews> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      reviews: unknown[];
      average: number | string;
      count: number | string;
    }>(`/products/${productId}/reviews`);
    return {
      reviews: (data.reviews ?? []).map(mapReview),
      average: Number(data.average ?? 0),
      count: Number(data.count ?? 0),
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return { reviews: [], average: 0, count: 0 };
    }
    throw err;
  }
}

/** Find a single review by transaction ID — used by post-tx prompt to detect
 *  whether the buyer has already rated this purchase. Still on mocks; will
 *  move to backend when `/transactions/:id/review` lands. */
export function reviewForTransaction(transactionId: string): Review | null {
  return MOCK_REVIEWS.find((r) => r.transactionId === transactionId) ?? null;
}
