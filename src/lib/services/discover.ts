import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
import type {
  BoostPlanId,
  DailyAdStat,
  DiscoverAdCampaign,
  DiscoverFeedItem,
  DiscoverPost,
  FeedPage,
} from "@/types";

const PAGE_SIZE = 12;

interface GetDiscoverParams {
  cursor?: string | null;
  limit?: number;
}

/**
 * Build the nested `video` object from either the new flat
 * `videoUrl` + `posterUrl` shape (Discover v2 endpoints) OR the older
 * nested `video: { url, poster }` shape (the public `/discover` feed
 * still uses this per backend's v2 deploy doc — "Response shape
 * unchanged").
 */
function mapVideo(r: Record<string, unknown>): DiscoverPost["video"] {
  const nested = r.video as DiscoverPost["video"] | undefined;
  if (nested && typeof nested === "object" && "url" in nested) return nested;
  return {
    url: String(r.videoUrl ?? ""),
    poster:
      typeof r.posterUrl === "string" && r.posterUrl
        ? r.posterUrl
        : undefined,
  };
}

/** Same dual-shape handling for the CTA discriminated union. */
function mapCta(r: Record<string, unknown>): DiscoverPost["cta"] {
  const nested = r.cta as DiscoverPost["cta"] | undefined;
  if (nested && typeof nested === "object" && "type" in nested) return nested;
  const flatType = r.ctaType === "shop" ? "shop" : "product";
  const targetId = String(r.ctaTargetId ?? "");
  return flatType === "product"
    ? { type: "product", productId: targetId }
    : { type: "shop", shopId: targetId };
}

function mapDiscoverItem(raw: unknown): DiscoverFeedItem {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id),
    shopId: String(r.shopId ?? ""),
    video: mapVideo(r),
    caption: (r.caption as string | undefined) ?? undefined,
    cta: mapCta(r),
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    expiresAt: r.expiresAt ? String(r.expiresAt) : undefined,
    editsRemaining:
      typeof r.editsRemaining === "number" ? r.editsRemaining : undefined,
    impressions: Number(r.impressions ?? 0),
    clicks: Number(r.clicks ?? 0),
    saves: Number(r.saves ?? 0),
    sponsored: Boolean(r.sponsored ?? false),
  };
}

function mapDiscoverPost(raw: unknown): DiscoverPost {
  const r = raw as Record<string, unknown>;
  const statusRaw = r.status;
  const status =
    statusRaw === "organic" || statusRaw === "boosted" || statusRaw === "expired"
      ? statusRaw
      : undefined;
  return {
    id: String(r.id),
    shopId: String(r.shopId ?? ""),
    video: mapVideo(r),
    caption: (r.caption as string | undefined) ?? undefined,
    cta: mapCta(r),
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    expiresAt: r.expiresAt ? String(r.expiresAt) : undefined,
    sponsored:
      typeof r.sponsored === "boolean" ? r.sponsored : undefined,
    editsRemaining:
      typeof r.editsRemaining === "number" ? r.editsRemaining : undefined,
    lastEditedAt:
      typeof r.lastEditedAt === "string" || r.lastEditedAt === null
        ? (r.lastEditedAt as string | null)
        : undefined,
    status,
    intentFree:
      typeof r.intentFree === "boolean" ? r.intentFree : undefined,
    impressions: Number(r.impressions ?? 0),
    clicks: Number(r.clicks ?? 0),
    saves: Number(r.saves ?? 0),
  };
}

export async function getDiscoverFeed({
  cursor,
  limit = PAGE_SIZE,
}: GetDiscoverParams = {}): Promise<FeedPage & { items: DiscoverFeedItem[] }> {
  const api = await getApi();
  const params: Record<string, string | number> = { limit };
  if (cursor) params.cursor = cursor;

  const { data } = await api.get<{
    items: unknown[];
    nextCursor: string | null;
  }>("/discover", { params });

  return {
    items: (data.items ?? []).map(mapDiscoverItem),
    products: [],
    nextCursor: data.nextCursor ?? null,
  };
}

/** Current seller's Discover campaigns. Phase 7 live endpoint. Backend
 *  infers the shop from the session cookie; the `shopId` param the
 *  existing callers pass is ignored here but kept for backwards-compat. */
export async function getMyDiscoverCampaigns(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _shopId: string
): Promise<Array<DiscoverAdCampaign & { post: DiscoverPost }>> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      items?: Array<DiscoverAdCampaign & { post: DiscoverPost }>;
      campaigns?: Array<DiscoverAdCampaign & { post: DiscoverPost }>;
    }>("/discover/campaigns/me");
    return data.items ?? data.campaigns ?? [];
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
}

/** Per-campaign analytics for the `/seller/ads/[id]` page. */
export async function getDiscoverAdAnalytics(campaignId: string): Promise<{
  campaign: DiscoverAdCampaign;
  post: DiscoverPost;
  daily: DailyAdStat[];
} | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      campaign: DiscoverAdCampaign;
      post: DiscoverPost;
      daily: DailyAdStat[];
    }>(`/discover/campaigns/${campaignId}/analytics`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/**
 * Fetch a single Discover post by id (owner-only). Backend shipped the
 * direct lookup on 2026-06-06 — see BACKEND deploy doc same date. Returns
 * `null` on 404 so the loader can render a clean "not found" state.
 */
export async function getDiscoverPostById(
  postId: string
): Promise<DiscoverPost | null> {
  try {
    const { data } = await apiClient().get<{ post: unknown }>(
      `/discover/posts/${postId}`
    );
    return mapDiscoverPost(data.post);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/**
 * Daily analytics for a Discover post. Backend ships a post-keyed
 * endpoint (deploy 2026-06-06) that returns the post counters plus the
 * most-relevant campaign (active first, else most recently ended) plus
 * its daily breakdown. For never-boosted posts `campaign` is `null` and
 * `daily` is `[]` — caller handles both shapes.
 *
 * Returns `null` on 404 only (post deleted / no access). Other errors
 * propagate so the loader can surface them.
 */
export async function getDiscoverPostAnalytics(
  postId: string
): Promise<{
  campaign: DiscoverAdCampaign | null;
  daily: DailyAdStat[];
} | null> {
  try {
    const { data } = await apiClient().get<{
      post: unknown;
      campaign: DiscoverAdCampaign | null;
      daily: DailyAdStat[];
    }>(`/discover/posts/${postId}/analytics`);
    return { campaign: data.campaign, daily: data.daily ?? [] };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/** Fire-and-forget impression beacon — called as a DiscoverItem comes
 *  into view. Errors swallowed; this is telemetry, not a critical path. */
export function recordDiscoverImpression(postId: string): void {
  apiClient()
    .post(`/discover/posts/${postId}/impression`)
    .catch(() => undefined);
}

/** Fire-and-forget click beacon — called when the user taps the CTA on
 *  a DiscoverItem. */
export function recordDiscoverClick(postId: string): void {
  apiClient()
    .post(`/discover/posts/${postId}/click`)
    .catch(() => undefined);
}

interface UploadDiscoverPostArgs {
  videoFile: File;
  posterFile?: File;
  caption?: string;
  cta: DiscoverPost["cta"];
  /** "free" → counts toward the 3/30d cap, no Paystack follow-up.
   *  "boost" → uncapped; caller chains `purchaseDiscoverCampaign` after.
   *  Backend enforces the cap server-side based on this flag. */
  intent: "free" | "boost";
  /** Optional callback wired into Axios `onUploadProgress`. Receives the
   *  current % (0–100). Use to drive UploadOverlay. */
  onProgress?: (percent: number) => void;
}

/**
 * Upload a Discover video post (multipart). Backend uploads to Cloudinary
 * (generating a poster frame if `posterFile` is absent) and returns the
 * persisted post. For "boost" intent, caller chains `purchaseDiscoverCampaign`
 * after this resolves. For "free" intent, this is the whole flow.
 */
export async function uploadDiscoverPost(
  args: UploadDiscoverPostArgs
): Promise<DiscoverPost> {
  const fd = new FormData();
  fd.append("video", args.videoFile);
  if (args.posterFile) fd.append("poster", args.posterFile);
  if (args.caption) fd.append("caption", args.caption);
  // Backend v2 expects camelCase here — confirmed via VALIDATION_FAILED
  // when sent as snake_case (`cta_type` / `cta_id`).
  fd.append("ctaType", args.cta.type);
  fd.append(
    "ctaTargetId",
    args.cta.type === "product" ? args.cta.productId : args.cta.shopId
  );
  fd.append("intent", args.intent);
  const { data } = await apiClient().post<{ post: unknown }>(
    "/discover/posts",
    fd,
    args.onProgress
      ? {
          onUploadProgress: (e) => {
            if (!e.total) return;
            args.onProgress!(Math.round((e.loaded / e.total) * 100));
          },
        }
      : undefined
  );
  return mapDiscoverPost(data.post);
}

interface EditDiscoverPostArgs {
  caption?: string;
  posterFile?: File;
}

/**
 * Paid-tier edit on a Discover post. Backend rejects on free posts
 * (`403 not_boosted`), expired posts (`403 post_expired`), exhausted edit
 * caps (`400 edit_limit_reached`), and any attempt to change `video` or
 * `cta` (we only send caption + poster so that's an internal guarantee).
 *
 * Send only the field(s) being changed — backend rejects empty bodies
 * with `400 nothing_to_edit`.
 */
export async function editDiscoverPost(
  postId: string,
  args: EditDiscoverPostArgs
): Promise<DiscoverPost> {
  const fd = new FormData();
  if (args.caption !== undefined) fd.append("caption", args.caption);
  if (args.posterFile) fd.append("poster", args.posterFile);
  const { data } = await apiClient().patch<{ post: unknown }>(
    `/discover/posts/${postId}`,
    fd
  );
  return mapDiscoverPost(data.post);
}

interface MyDiscoverPostsPage {
  items: DiscoverPost[];
  nextCursor: string | null;
}

/**
 * The current seller's own Discover posts — free, boosted, and expired
 * all included. Drives the `/seller/ads` list. Distinct from
 * `getMyDiscoverCampaigns`, which only returns posts with a paid campaign
 * attached.
 */
export async function getMyDiscoverPosts(
  args: { cursor?: string | null; limit?: number } = {}
): Promise<MyDiscoverPostsPage> {
  const api = await getApi();
  const params: Record<string, string | number> = {};
  if (args.cursor) params.cursor = args.cursor;
  if (args.limit) params.limit = args.limit;
  try {
    const { data } = await api.get<{
      items: unknown[];
      nextCursor: string | null;
    }>("/discover/posts/me", { params });
    return {
      items: (data.items ?? []).map(mapDiscoverPost),
      nextCursor: data.nextCursor ?? null,
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404)
      return { items: [], nextCursor: null };
    throw err;
  }
}

/**
 * Permanently remove a Discover post the seller owns. Backend soft-deletes
 * (per the standard pattern) so any in-flight clicks/saves still resolve
 * to a sane 404. Boosted posts: backend cancels the campaign on delete —
 * no refund is automatic (seller-initiated removal). Free posts: just
 * removed from the rotation.
 */
export async function deleteDiscoverPost(postId: string): Promise<void> {
  await apiClient().delete(`/discover/posts/${postId}`);
}

interface PurchaseCampaignResponse {
  authorization_url: string;
  reference: string;
}

/**
 * Start a paid Discover campaign for an uploaded post. Returns the Paystack
 * authorization URL — the caller redirects the browser to it. Backend writes
 * the `discover_campaigns` row on the Paystack success webhook.
 */
export async function purchaseDiscoverCampaign(args: {
  postId: string;
  planId: BoostPlanId;
}): Promise<PurchaseCampaignResponse> {
  const { data } = await apiClient().post<PurchaseCampaignResponse>(
    "/discover/campaigns",
    { postId: args.postId, plan: args.planId }
  );
  return data;
}
