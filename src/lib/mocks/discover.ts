import type { DailyAdStat, DiscoverAdCampaign, DiscoverPost } from "@/types";

const VIDEO = (slug: string) =>
  `https://assets.mixkit.co/videos/preview/${slug}.mp4`;
const POSTER = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

/**
 * Seller-uploaded Discover posts. Some are organic-only; a few have active
 * paid campaigns and so always render in sponsored slots (see MOCK_DISCOVER_CAMPAIGNS).
 */
export const MOCK_DISCOVER_POSTS: DiscoverPost[] = [
  {
    id: "dp_01",
    shopId: "s_03",
    video: {
      url: VIDEO("mixkit-fashion-model-with-a-floral-summer-dress-39763-medium"),
      poster: POSTER("photo-1548036328-c9fa89d128fa"),
    },
    caption: "Y2K silk slip — fresh haul. DM if you spot something.",
    cta: { type: "product", productId: "p_03" },
    createdAt: "2026-05-26T08:30:00Z",
    impressions: 4820,
    clicks: 312,
    saves: 78,
  },
  {
    id: "dp_02",
    shopId: "s_06",
    video: {
      url: VIDEO("mixkit-young-woman-modeling-a-summer-floral-dress-41530-medium"),
      poster: POSTER("photo-1490481651871-ab68de25d43d"),
    },
    caption: "Custom Ankara two-piece — finished this morning. Lagos pickup or nationwide.",
    cta: { type: "product", productId: "p_06" },
    createdAt: "2026-05-26T07:00:00Z",
    impressions: 2105,
    clicks: 168,
    saves: 41,
  },
  {
    id: "dp_03",
    shopId: "s_04",
    video: {
      url: VIDEO("mixkit-young-woman-doing-makeup-in-the-mirror-39842-medium"),
      poster: POSTER("photo-1586495777744-4413f21062fa"),
    },
    caption: "Ruby Woo restock — last few. Free delivery in Lagos today.",
    cta: { type: "product", productId: "p_14" },
    createdAt: "2026-05-25T14:00:00Z",
    impressions: 3290,
    clicks: 224,
    saves: 56,
  },
  {
    id: "dp_04",
    shopId: "s_03",
    video: {
      url: VIDEO("mixkit-clothes-on-a-rack-in-a-store-4651-medium"),
      poster: POSTER("photo-1542272604-787c3835535d"),
    },
    caption: "Vintage Levi's 501 — deadstock W30 L32. Original tags.",
    cta: { type: "product", productId: "p_10" },
    createdAt: "2026-05-25T11:00:00Z",
    impressions: 1840,
    clicks: 91,
    saves: 22,
  },
  {
    id: "dp_05",
    shopId: "s_11",
    video: {
      url: VIDEO("mixkit-woman-trying-on-clothes-in-a-clothing-store-4633-medium"),
      poster: POSTER("photo-1572804013309-59a88b7e92f1"),
    },
    caption: "Zara midi dress — size M, worn once, dry-cleaned.",
    cta: { type: "product", productId: "p_15" },
    createdAt: "2026-05-24T16:00:00Z",
    impressions: 980,
    clicks: 47,
    saves: 13,
  },
  {
    id: "dp_06",
    shopId: "s_03",
    video: {
      url: VIDEO("mixkit-a-fashion-model-in-a-blue-and-white-outfit-39767-medium"),
      poster: POSTER("photo-1551488831-00ddcb6c6bd3"),
    },
    caption: "Cropped denim — Y2K wash, oversized fit.",
    cta: { type: "shop", shopId: "s_03" },
    createdAt: "2026-05-24T09:00:00Z",
    impressions: 712,
    clicks: 34,
    saves: 9,
  },
  {
    id: "dp_07",
    shopId: "s_me",
    video: {
      url: VIDEO("mixkit-fashion-model-with-a-floral-summer-dress-39763-medium"),
      poster: POSTER("photo-1539109136881-3be0616acf4b"),
    },
    caption: "Silk slip restock — champagne, three colorways available.",
    cta: { type: "product", productId: "mp_01" },
    createdAt: "2026-05-23T12:00:00Z",
    impressions: 5240,
    clicks: 386,
    saves: 92,
  },
  {
    id: "dp_08",
    shopId: "s_me",
    video: {
      url: VIDEO("mixkit-young-woman-modeling-a-summer-floral-dress-41530-medium"),
      poster: POSTER("photo-1582418702059-97ebafb35d09"),
    },
    caption: "Mom jeans — high-waist, deadstock 90s. Limited stock.",
    cta: { type: "product", productId: "mp_03" },
    createdAt: "2026-05-22T15:30:00Z",
    impressions: 1450,
    clicks: 79,
    saves: 18,
  },
];

/**
 * Active paid Discover campaigns. Posts referenced here are guaranteed to
 * appear in sponsored slots and accumulate analytics under the campaign.
 */
export const MOCK_DISCOVER_CAMPAIGNS: DiscoverAdCampaign[] = [
  {
    id: "dc_01",
    postId: "dp_07",
    shopId: "s_me",
    plan: "quarterly",
    spend: 22500,
    startsAt: "2026-05-15T00:00:00Z",
    endsAt: "2026-08-15T00:00:00Z",
    active: true,
  },
  {
    id: "dc_02",
    postId: "dp_03",
    shopId: "s_04",
    plan: "monthly",
    spend: 7500,
    startsAt: "2026-05-20T00:00:00Z",
    endsAt: "2026-06-20T00:00:00Z",
    active: true,
  },
  {
    id: "dc_03",
    postId: "dp_01",
    shopId: "s_03",
    plan: "monthly",
    spend: 7500,
    startsAt: "2026-05-22T00:00:00Z",
    endsAt: "2026-06-22T00:00:00Z",
    active: true,
  },
];

/**
 * Build 14 days of per-day stats for a campaign by spreading the post's
 * lifetime counters across the campaign window with mild noise.
 */
export function dailyStatsFor(campaignId: string): DailyAdStat[] {
  const campaign = MOCK_DISCOVER_CAMPAIGNS.find((c) => c.id === campaignId);
  if (!campaign) return [];
  const post = MOCK_DISCOVER_POSTS.find((p) => p.id === campaign.postId);
  if (!post) return [];

  const days = 14;
  const totalImpr = Math.round(post.impressions * 0.65);
  const totalClicks = Math.round(post.clicks * 0.65);
  const out: DailyAdStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const weight = 0.5 + Math.sin((i / days) * Math.PI) * 0.8;
    out.push({
      date: d.toISOString().slice(0, 10),
      impressions: Math.round((totalImpr / days) * weight),
      clicks: Math.round((totalClicks / days) * weight),
    });
  }
  return out;
}
