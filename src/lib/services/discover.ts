import {
  MOCK_DISCOVER_CAMPAIGNS,
  MOCK_DISCOVER_POSTS,
  dailyStatsFor,
} from "@/lib/mocks/discover";
import { apiClient, getApi } from "@/lib/api";
import type {
  BoostPlanId,
  DailyAdStat,
  DiscoverAdCampaign,
  DiscoverFeedItem,
  DiscoverPost,
  FeedPage,
} from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
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

export async function getMyDiscoverCampaigns(
  shopId: string
): Promise<Array<DiscoverAdCampaign & { post: DiscoverPost }>> {
  await delay(250);
  return MOCK_DISCOVER_CAMPAIGNS.filter((c) => c.shopId === shopId)
    .sort(
      (a, b) =>
        new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    )
    .map((c) => ({
      ...c,
      post: MOCK_DISCOVER_POSTS.find((p) => p.id === c.postId)!,
    }));
}

export async function getDiscoverAdAnalytics(campaignId: string): Promise<{
  campaign: DiscoverAdCampaign;
  post: DiscoverPost;
  daily: DailyAdStat[];
} | null> {
  await delay(250);
  const campaign = MOCK_DISCOVER_CAMPAIGNS.find((c) => c.id === campaignId);
  if (!campaign) return null;
  const post = MOCK_DISCOVER_POSTS.find((p) => p.id === campaign.postId);
  if (!post) return null;
  return { campaign, post, daily: dailyStatsFor(campaignId) };
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
