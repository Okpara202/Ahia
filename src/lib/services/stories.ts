import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
import type { Media, Story } from "@/types";

function mapStory(raw: unknown): Story {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id),
    shopId: String(r.shopId ?? ""),
    media: r.media as Media,
    caption: (r.caption as string | undefined) ?? undefined,
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    productId: (r.productId as string | undefined) ?? undefined,
  };
}

export async function getShopStories(shopId: string): Promise<Story[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      items?: unknown[];
      stories?: unknown[];
    }>(`/shops/${shopId}/stories`);
    return ((data.items ?? data.stories) ?? []).map(mapStory);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
}

interface CreateStoryArgs {
  file: File;
  /** When true, send the file under the `video` multipart field. Backend
   *  generates the poster via Cloudinary transformation. */
  isVideo: boolean;
  caption?: string;
  productId?: string;
  durationMs?: number;
}

/**
 * Drop a new 24h story on the current seller's shop. Multipart per
 * Phase 7 spec — backend accepts either `image` OR `video` (mutually
 * exclusive). The field name signals the media type; backend stores the
 * Cloudinary URL + auto-generates a poster for video.
 */
export async function createStory(args: CreateStoryArgs): Promise<Story> {
  const fd = new FormData();
  fd.append(args.isVideo ? "video" : "image", args.file);
  if (args.caption) fd.append("caption", args.caption);
  if (args.productId) fd.append("product_id", args.productId);
  if (args.durationMs) fd.append("duration_ms", String(args.durationMs));
  const { data } = await apiClient().post<{ story: unknown }>(
    "/shops/me/stories",
    fd
  );
  return mapStory(data.story);
}

/** Owner's own active stories with truthful view counts. Used by the
 *  forthcoming `/seller/stories` page. Pre-deploy 404 → empty. */
export async function getMyStories(): Promise<Story[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      items?: unknown[];
      stories?: unknown[];
    }>("/shops/me/stories");
    return ((data.items ?? data.stories) ?? []).map(mapStory);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
}

/** Get a single story by id (the canonical permalink endpoint). Used by
 *  the `/stories/[id]` SSR page so we can render OpenGraph meta for
 *  WhatsApp / Twitter previews. Backend returns `404 story_expired` past
 *  the 24h window. */
export async function getStoryById(id: string): Promise<Story | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ story?: unknown } & Record<string, unknown>>(
      `/stories/${id}`
    );
    return mapStory(data.story ?? data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/** Soft-delete a story before its 24h expiry. Owner-only. */
export async function deleteStory(id: string): Promise<void> {
  await apiClient().delete(`/shops/me/stories/${id}`);
}

/** Record a story view. Fire-and-forget — backend handles the dedupe
 *  per session + bumps the Redis counter + writes the `story_views` row
 *  for authed callers (enabling the "seen" indicator). */
export function recordStoryView(id: string): void {
  apiClient()
    .post(`/stories/${id}/view`)
    .catch(() => undefined);
}
