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

function mapDiscoverItem(raw: unknown): DiscoverFeedItem {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id),
    shopId: String(r.shopId ?? ""),
    video: r.video as DiscoverPost["video"],
    caption: (r.caption as string | undefined) ?? undefined,
    cta: r.cta as DiscoverPost["cta"],
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
  return {
    id: String(r.id),
    shopId: String(r.shopId ?? ""),
    video: r.video as DiscoverPost["video"],
    caption: (r.caption as string | undefined) ?? undefined,
    cta: r.cta as DiscoverPost["cta"],
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    expiresAt: r.expiresAt ? String(r.expiresAt) : undefined,
    sponsored:
      typeof r.sponsored === "boolean" ? r.sponsored : undefined,
    editsRemaining:
      typeof r.editsRemaining === "number" ? r.editsRemaining : undefined,
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
 * Fetch a single Discover post by id. Used by the `/seller/ads/[id]`
 * analytics page, which now keys off post id (so free posts have a
 * landing page too — campaign id no longer required).
 *
 * Backend endpoint expected: `GET /discover/posts/:id`. We assume this
 * exists as the natural REST counterpart to the existing list endpoint
 * `GET /discover/posts/me`. If backend hasn't shipped it, we'll see a
 * 404 here and fall through to notFound() — flag it then.
 */
export async function getDiscoverPostById(
  postId: string
): Promise<DiscoverPost | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ post: unknown }>(
      `/discover/posts/${postId}`
    );
    return mapDiscoverPost(data.post);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/**
 * Daily analytics keyed by post id. Returned only when the post is
 * sponsored; backend can either reuse the existing campaign-keyed
 * `/discover/campaigns/:id/analytics` (with a postId lookup) or expose
 * a new `/discover/posts/:id/analytics` — whichever they prefer.
 */
export async function getDiscoverPostAnalytics(
  postId: string
): Promise<{
  campaign: DiscoverAdCampaign | null;
  daily: DailyAdStat[];
} | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      campaign: DiscoverAdCampaign | null;
      daily: DailyAdStat[];
    }>(`/discover/posts/${postId}/analytics`);
    return data;
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
  fd.append("cta_type", args.cta.type);
  fd.append(
    "cta_id",
    args.cta.type === "product" ? args.cta.productId : args.cta.shopId
  );
  fd.append("intent", args.intent);
  const { data } = await apiClient().post<{ post: unknown }>(
    "/discover/posts",
    fd
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
