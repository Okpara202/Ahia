import type { Review } from "@/types";

/**
 * Mock reviews. Each review is anchored to a real product + transaction.
 * Replace with backend reads once `GET /products/:id/reviews` is live.
 */
export const MOCK_REVIEWS: Review[] = [
  {
    id: "r_01",
    productId: "p_01",
    shopId: "s_01",
    transactionId: "t_p_01",
    authorId: "u_amaka",
    authorName: "Amaka",
    rating: 5,
    body: "Came exactly as in the pictures. Shipped to Abuja in 2 days. Will buy again.",
    createdAt: "2026-05-22T11:30:00Z",
  },
  {
    id: "r_02",
    productId: "p_01",
    shopId: "s_01",
    transactionId: "t_p_01_b",
    authorId: "u_kemi",
    authorName: "Kemi",
    rating: 5,
    body: "Honestly the easiest shopping experience. Escrow gave me peace.",
    createdAt: "2026-05-18T15:10:00Z",
  },
  {
    id: "r_03",
    productId: "p_01",
    shopId: "s_01",
    transactionId: "t_p_01_c",
    authorId: "u_seyi",
    authorName: "Seyi",
    rating: 4,
    body: "Sizing ran small but seller swapped without drama. Good comms.",
    createdAt: "2026-05-08T09:00:00Z",
  },
  {
    id: "r_04",
    productId: "p_02",
    shopId: "s_02",
    transactionId: "t_p_02",
    authorId: "u_tomi",
    authorName: "Tomi",
    rating: 5,
    body: "Perfect for school. Battery is solid.",
    createdAt: "2026-05-20T14:00:00Z",
  },
  {
    id: "r_05",
    productId: "p_03",
    shopId: "s_03",
    transactionId: "t_p_03",
    authorId: "u_chika",
    authorName: "Chika",
    rating: 5,
    body: "Y2K thrift fits exactly as described. ✨",
    createdAt: "2026-05-19T17:45:00Z",
  },
  {
    id: "r_06",
    productId: "p_04",
    shopId: "s_04",
    transactionId: "t_p_04",
    authorId: "u_busayo",
    authorName: "Busayo",
    rating: 4,
    body: "Foundation match was correct. Packaging could be neater.",
    createdAt: "2026-05-14T10:00:00Z",
  },
];

export function reviewsForProduct(productId: string): Review[] {
  // Match both base IDs (e.g. p_01) and paginated IDs (p_01_p2_5).
  const match = productId.match(/^((?:m?p)_\d+)/);
  const base = match ? match[1] : productId;
  return MOCK_REVIEWS.filter((r) => r.productId === base).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function aggregateRating(
  reviews: Review[]
): { average: number; count: number } {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}
