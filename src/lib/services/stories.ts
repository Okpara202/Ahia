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
  caption?: string;
  productId?: string;
  durationMs?: number;
}

/**
 * Drop a new 24h story on the current seller's shop. Multipart per
 * BACKEND_HANDOFF.md §3 — backend uploads the image to Cloudinary and
 * stores the returned URL on the story.
 */
export async function createStory(args: CreateStoryArgs): Promise<Story> {
  const fd = new FormData();
  fd.append("image", args.file);
  if (args.caption) fd.append("caption", args.caption);
  if (args.productId) fd.append("product_id", args.productId);
  if (args.durationMs) fd.append("duration_ms", String(args.durationMs));
  const { data } = await apiClient().post<{ story: unknown }>(
    "/shops/me/stories",
    fd
  );
  return mapStory(data.story);
}
