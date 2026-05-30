import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
import type { FeedPage, Media, Product, Shop } from "@/types";

const PAGE_SIZE = 12;

/** Sentinel for "no location filter applied". Lives outside the backend
 *  `/locations` response, so the UI mixes it in client-side. */
export const ALL_LOCATIONS = "All Nigeria";

/** Free-form because the list comes from `/locations` at runtime. */
export type LocationFilter = string;

/** Fetches the distinct list of NG cities with at least one active seller
 *  shop. Empty list = nobody has set a location yet — the filter chip
 *  should fall back to just the All-Nigeria sentinel. */
export async function getLocations(): Promise<string[]> {
  const { data } = await apiClient().get<{ locations: string[] }>("/locations");
  return data.locations;
}

interface GetFeedParams {
  cursor?: string | null;
  limit?: number;
  location?: LocationFilter;
}

/** Backend serializes Postgres NUMERIC as strings — coerce to number. */
function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Translate backend's image fields into the frontend's discriminated-union
 *  media shape.
 *
 *  Backend returns:
 *  - `cover: string` — single Cloudinary URL for the cover (or null/missing)
 *  - `gallery: string[]` — optional array of additional Cloudinary URLs
 *
 *  When cover is missing the media URL is an empty string — consumers gate
 *  on `media.url` truthy before rendering, so an empty URL cleanly shows the
 *  bg-muted placeholder instead of a broken `<img>`.
 *
 *  Exported so `shops.ts` can use the same translation when listing a shop's
 *  products — avoids drift between the two product-fetching paths. */
export function deriveProductMedia(raw: Record<string, unknown>): {
  media: Media;
  gallery?: Media[];
} {
  const cover = typeof raw.cover === "string" ? raw.cover : "";
  const galleryRaw = Array.isArray(raw.gallery) ? (raw.gallery as unknown[]) : [];
  const galleryUrls = galleryRaw.filter((u): u is string => typeof u === "string");

  const media: Media = { type: "image", url: cover };
  const gallery: Media[] | undefined =
    galleryUrls.length > 0
      ? galleryUrls.map((url) => ({ type: "image", url }))
      : undefined;
  return { media, gallery };
}

/** Normalize a backend product payload into the frontend `Product` shape.
 *  Tolerates missing fields and string-encoded numerics. */
function mapProduct(raw: unknown): Product {
  const r = raw as Record<string, unknown>;
  const shopRaw = (r.shop ?? {}) as Record<string, unknown>;
  const shop: Shop = {
    id: String(shopRaw.id ?? ""),
    name: String(shopRaw.name ?? ""),
    handle: String(shopRaw.handle ?? ""),
    verified: Boolean(shopRaw.verified ?? false),
    bio: (shopRaw.bio as string | undefined) ?? undefined,
    avatarUrl: (shopRaw.avatarUrl as string | undefined) ?? undefined,
    bannerUrl: (shopRaw.bannerUrl as string | undefined) ?? undefined,
    showLegalName:
      (shopRaw.showLegalName as boolean | undefined) ?? undefined,
    createdAt: (shopRaw.createdAt as string | undefined) ?? undefined,
    totalSales:
      shopRaw.totalSales !== undefined ? toNumber(shopRaw.totalSales) : undefined,
    location: (shopRaw.location as string | undefined) ?? undefined,
    ownerId: (shopRaw.ownerId as string | undefined) ?? undefined,
    // Needed so the buyer-side paused banner can render on product pages
    // without a second fetch. Backend includes it on the nested shop.
    isActive: (shopRaw.isActive as boolean | undefined) ?? undefined,
  };
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

/**
 * Get a paginated, ranked product feed.
 * Backend returns `{ items, nextCursor }`; we map onto the legacy
 * `{ products, nextCursor }` shape so UI consumers stay unchanged.
 */
export async function getFeed({
  cursor,
  limit = PAGE_SIZE,
  location,
}: GetFeedParams = {}): Promise<FeedPage> {
  const api = await getApi();
  const params: Record<string, string | number> = { limit };
  if (cursor) params.cursor = cursor;
  if (location && location !== "All Nigeria") params.location = location;

  const { data } = await api.get<{
    items: unknown[];
    nextCursor: string | null;
  }>("/feed", { params });

  return {
    products: (data.items ?? []).map(mapProduct),
    nextCursor: data.nextCursor ?? null,
  };
}

/**
 * Get a single product by ID. Backend wraps `{ product }` on success per
 * the API convention. Returns `null` on 404 so server components can call
 * `notFound()`.
 */
export async function getProduct(id: string): Promise<Product | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ product: unknown }>(`/products/${id}`);
    return mapProduct(data.product);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/**
 * Free-text product search. Server applies its own ranking; we just pass
 * `q` and optional `location` through.
 */
export async function searchProducts(
  query: string,
  location?: LocationFilter
): Promise<Product[]> {
  const api = await getApi();
  const params: Record<string, string> = { type: "products", q: query.trim() };
  if (location && location !== "All Nigeria") params.location = location;
  const { data } = await api.get<{ products?: unknown[]; items?: unknown[] }>(
    "/search",
    { params }
  );
  return ((data.products ?? data.items) ?? []).map(mapProduct);
}

/**
 * Create a new product (multipart). The form bundles `image_files[]` for
 * freshly-picked files and `image_urls[]` for pasted/existing links; the
 * backend uploads files to Cloudinary, normalizes URLs, and stores the
 * ordered list with `cover_index` as the cover (`product.media`).
 *
 * Lives in the service layer (not `actions/`) so the browser's native
 * `FormData` rides the request directly — Next.js Server Actions strip the
 * stream when forwarding to a separate backend.
 */
export async function createProduct(form: FormData): Promise<Product> {
  const { data } = await apiClient().post<{ product: unknown }>(
    "/products",
    form
  );
  return mapProduct(data.product);
}

/**
 * Update an existing product. Same multipart shape as `createProduct`.
 * Re-ordering items / changing `cover_index` reassigns the cover.
 */
export async function updateProduct(
  productId: string,
  form: FormData
): Promise<Product> {
  const { data } = await apiClient().patch<{ product: unknown }>(
    `/products/${productId}`,
    form
  );
  return mapProduct(data.product);
}
