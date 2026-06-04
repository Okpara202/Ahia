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
    impressions: Number(r.impressions ?? 0),
    clicks: Number(r.clicks ?? 0),
    saves: Number(r.saves ?? 0),
    sponsored: Boolean(r.sponsored ?? false),
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
}

/**
 * Upload a Discover video post (multipart). Backend uploads to Cloudinary
 * (generating a poster frame if `posterFile` is absent) and returns the
 * persisted post. The follow-up `purchaseDiscoverCampaign` actually puts
 * it in front of buyers.
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
  const { data } = await apiClient().post<{ post: DiscoverPost }>(
    "/discover/posts",
    fd
  );
  return data.post;
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
