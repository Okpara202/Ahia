import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
import type { Media, Story } from "@/types";

/**
 * Build the Media discriminated union from backend's response. Tolerates
 * both shapes:
 *   - nested:  `media: { type, url, poster? }` (what the buyer-side
 *              /shops/:id/stories returns and what works today)
 *   - flat:    `mediaType: "image"|"video", mediaUrl, posterUrl?`
 *              or the looser `videoUrl|imageUrl, posterUrl?` variant
 *              (what some endpoints in v2 started using)
 *
 * Returns `null` when nothing parseable is present so the caller can
 * decide what to do (StoryCard renders a sparkle placeholder).
 */
function deriveStoryMedia(r: Record<string, unknown>): Media | null {
  const nested = r.media as Media | undefined;
  if (
    nested &&
    typeof nested === "object" &&
    "type" in nested &&
    "url" in nested
  ) {
    return nested;
  }
  const explicitType = r.mediaType === "video" ? "video" : r.mediaType === "image" ? "image" : null;
  const url =
    (typeof r.mediaUrl === "string" && r.mediaUrl) ||
    (typeof r.videoUrl === "string" && r.videoUrl) ||
    (typeof r.imageUrl === "string" && r.imageUrl) ||
    "";
  if (!url) return null;
  const poster =
    typeof r.posterUrl === "string" && r.posterUrl ? r.posterUrl : undefined;
  // If we have a video URL OR explicit video type → video. Otherwise image.
  const type =
    explicitType ?? (typeof r.videoUrl === "string" ? "video" : "image");
  return type === "video"
    ? { type: "video", url, poster }
    : { type: "image", url };
}

function mapStory(raw: unknown): Story {
  const r = raw as Record<string, unknown>;
  const media = deriveStoryMedia(r);
  return {
    id: String(r.id),
    shopId: String(r.shopId ?? ""),
    // The cast keeps the type Media (not Media | null) for downstream
    // consumers; the StoryCard / StoryViewer code already guards on
    // `if (!story.media) return null` so this stays safe.
    media: (media ?? undefined) as Media,
    caption: (r.caption as string | undefined) ?? undefined,
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    productId: (r.productId as string | undefined) ?? undefined,
    viewCount:
      typeof r.viewCount === "number" ? r.viewCount : undefined,
    viewed: typeof r.viewed === "boolean" ? r.viewed : undefined,
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
