import axios from "axios";

import { getApi } from "@/lib/api";

/** Item shape for `GET /me/following` — see FRONTEND_ASK_phase7.md §3.1.
 *  `sellerId` is the user id of the shop owner — needed by the buyer's
 *  "Message" button which calls `POST /conversations { sellerId }`. */
export interface FollowingShop {
  shopId: string;
  sellerId: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  lastStoryAt?: string;
  isOnline: boolean;
}

/** Item shape for `GET /shops/me/followers` — see FRONTEND_ASK_phase7.md §3.2. */
export interface ShopFollower {
  userId: string;
  name: string;
  avatarUrl?: string;
  followedAt: string;
  isOnline: boolean;
  allowsColdDMs: boolean;
}

interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Shops the current buyer follows. Backend lands this as part of Phase 7
 * (see FRONTEND_ASK_phase7.md §3). Until then we treat 404 as "empty" so
 * the consuming page shows its empty state instead of crashing.
 */
export async function getMyFollowing(
  cursor?: string | null
): Promise<PageResponse<FollowingShop>> {
  const api = await getApi();
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;
  try {
    const { data } = await api.get<PageResponse<FollowingShop>>(
      "/me/following",
      { params }
    );
    return { items: data.items ?? [], nextCursor: data.nextCursor ?? null };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return { items: [], nextCursor: null };
    }
    throw err;
  }
}

/**
 * Followers of the seller's own shop. Same not-yet-shipped tolerance as
 * `getMyFollowing` — 404 returns empty so the new `/seller/followers` page
 * shows an empty state pre-deploy.
 */
export async function getMyFollowers(
  cursor?: string | null
): Promise<PageResponse<ShopFollower>> {
  const api = await getApi();
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;
  try {
    const { data } = await api.get<PageResponse<ShopFollower>>(
      "/shops/me/followers",
      { params }
    );
    return { items: data.items ?? [], nextCursor: data.nextCursor ?? null };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return { items: [], nextCursor: null };
    }
    throw err;
  }
}
