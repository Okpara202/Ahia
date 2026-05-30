import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
import { deriveProductMedia } from "@/lib/services/products";
import type { Product, Shop } from "@/types";

/** Backend serializes Postgres NUMERIC as strings — coerce defensively. */
function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function mapShop(raw: unknown): Shop {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    handle: String(r.handle ?? ""),
    verified: Boolean(r.verified ?? false),
    bio: (r.bio as string | undefined) ?? undefined,
    avatarUrl: (r.avatarUrl as string | undefined) ?? undefined,
    bannerUrl: (r.bannerUrl as string | undefined) ?? undefined,
    showLegalName: (r.showLegalName as boolean | undefined) ?? undefined,
    createdAt: (r.createdAt as string | undefined) ?? undefined,
    updatedAt: (r.updatedAt as string | undefined) ?? undefined,
    totalSales:
      r.totalSales !== undefined ? toNumber(r.totalSales) : undefined,
    location: (r.location as string | undefined) ?? undefined,
    category: (r.category as string | undefined) ?? undefined,
    ownerId: (r.ownerId as string | undefined) ?? undefined,
    isFollowing: (r.isFollowing as boolean | undefined) ?? undefined,
    followerCount:
      r.followerCount !== undefined ? toNumber(r.followerCount) : undefined,
    isActive: (r.isActive as boolean | undefined) ?? undefined,
    deletedAt: (r.deletedAt as string | null | undefined) ?? undefined,
    ownerName: (r.ownerName as string | undefined) ?? undefined,
    productsCount:
      r.productsCount !== undefined ? toNumber(r.productsCount) : undefined,
  };
}

function mapProduct(raw: unknown): Product {
  const r = raw as Record<string, unknown>;
  const shop =
    r.shop !== undefined
      ? mapShop(r.shop)
      : ({
          id: "",
          name: "",
          handle: "",
          verified: false,
        } satisfies Shop);
  const { media, gallery } = deriveProductMedia(r);
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    price: toNumber(r.price),
    category: String(r.category ?? ""),
    description: String(r.description ?? ""),
    media,
    gallery,
    shop,
    sponsored: (r.sponsored as boolean | undefined) ?? false,
  };
}

export async function getShop(id: string): Promise<Shop | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ shop: unknown }>(`/shops/${id}`);
    return mapShop(data.shop);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function getShopProducts(shopId: string): Promise<Product[]> {
  const api = await getApi();
  const { data } = await api.get<{ items?: unknown[]; products?: unknown[] }>(
    "/products",
    { params: { shop: shopId } }
  );
  return ((data.items ?? data.products) ?? []).map(mapProduct);
}

/** Follow a shop. Idempotent — returns 204 whether you already followed
 *  or not. Backend records `(userId, shopId)` in the `follows` table. */
export async function followShop(shopId: string): Promise<void> {
  await apiClient().post(`/shops/${shopId}/follow`);
}

/** Unfollow a shop. Idempotent — returns 204 whether you followed or not. */
export async function unfollowShop(shopId: string): Promise<void> {
  await apiClient().delete(`/shops/${shopId}/follow`);
}

export async function searchShops(query: string): Promise<Shop[]> {
  const api = await getApi();
  const { data } = await api.get<{ shops?: unknown[]; items?: unknown[] }>(
    "/search",
    { params: { type: "shops", q: query.trim() } }
  );
  return ((data.shops ?? data.items) ?? []).map(mapShop);
}
