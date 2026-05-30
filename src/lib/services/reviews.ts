import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
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
    invoiceLineId: String(r.invoiceLineId ?? ""),
    authorId: String(r.authorId ?? ""),
    authorName: String(r.authorName ?? ""),
    rating: Number(r.rating ?? 0),
    body: (r.body as string | undefined) ?? undefined,
    createdAt: String(r.createdAt ?? new Date().toISOString()),
  };
}

/**
 * Get reviews for a product + aggregate score. Backend returns the
 * aggregate inline so UI gets count/average in one round-trip.
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

interface SubmitReviewArgs {
  invoiceLineId: string;
  rating: number;
  body?: string;
}

/**
 * Buyer submits a review for a released invoice line. Backend derives
 * product + shop from the line — frontend only sends the line id.
 * Chat v1 changed the contract from (transactionId, productId, shopId)
 * to just invoiceLineId.
 */
export async function submitReview(args: SubmitReviewArgs): Promise<Review> {
  const { data } = await apiClient().post<{ review: unknown }>("/reviews", {
    invoiceLineId: args.invoiceLineId,
    rating: args.rating,
    body: args.body,
  });
  return mapReview(data.review);
}
