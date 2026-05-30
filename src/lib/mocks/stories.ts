import type { Story } from "@/types";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

/** Mock 24h-style stories. The story strip filters by recency (≤ 24h old)
 * when the backend lands; for the mock phase we just include recent dates. */
export const MOCK_STORIES: Story[] = [
  // Thrifted by Ada — drop a fresh thrift haul
  {
    id: "st_01",
    shopId: "s_03",
    media: { type: "image", url: IMG("photo-1490481651871-ab68de25d43d"), alt: "Thrift haul" },
    caption: "New Y2K haul just unpacked. DM if you spot something.",
    createdAt: "2026-05-26T09:00:00Z",
    productId: "p_03",
  },
  {
    id: "st_02",
    shopId: "s_03",
    media: { type: "image", url: IMG("photo-1542272604-787c3835535d"), alt: "Vintage Levis" },
    caption: "Deadstock 501s — only one pair left.",
    createdAt: "2026-05-26T11:30:00Z",
    productId: "p_10",
  },
  {
    id: "st_03",
    shopId: "s_03",
    media: { type: "image", url: IMG("photo-1551488831-00ddcb6c6bd3"), alt: "Cropped denim" },
    caption: "Cropped denim back in stock.",
    createdAt: "2026-05-26T14:15:00Z",
  },

  // Glow by Tomi — beauty drops
  {
    id: "st_04",
    shopId: "s_04",
    media: { type: "image", url: IMG("photo-1586495777744-4413f21062fa"), alt: "Lipstick drop" },
    caption: "Ruby Woo — back in stock today only.",
    createdAt: "2026-05-26T10:00:00Z",
    productId: "p_14",
  },
  {
    id: "st_05",
    shopId: "s_04",
    media: { type: "image", url: IMG("photo-1522335789203-aaa0e6a3b06d"), alt: "Foundation" },
    caption: "Fenty 380 — last one. Free delivery in Lagos today.",
    createdAt: "2026-05-26T13:00:00Z",
    productId: "p_04",
  },

  // Ankara Studio
  {
    id: "st_06",
    shopId: "s_06",
    media: { type: "image", url: IMG("photo-1539109136881-3be0616acf4b"), alt: "Ankara fit" },
    caption: "Custom two-piece — finished this morning.",
    createdAt: "2026-05-26T08:00:00Z",
    productId: "p_06",
  },
  {
    id: "st_07",
    shopId: "s_06",
    media: { type: "image", url: IMG("photo-1582418702059-97ebafb35d09"), alt: "Bookings" },
    caption: "June bookings open. Lagos pickup or nationwide GIG.",
    createdAt: "2026-05-26T12:00:00Z",
  },

  // Sneaker Plug UI
  {
    id: "st_08",
    shopId: "s_01",
    media: { type: "image", url: IMG("photo-1600185365926-3a2ce3cdb9eb"), alt: "AF1 restock" },
    caption: "AF1 restock — size 41–44 only.",
    createdAt: "2026-05-26T15:00:00Z",
    productId: "p_01",
  },
];

export function storiesForShop(shopId: string): Story[] {
  return MOCK_STORIES.filter((s) => s.shopId === shopId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function shopsWithStories(): string[] {
  return Array.from(new Set(MOCK_STORIES.map((s) => s.shopId)));
}
