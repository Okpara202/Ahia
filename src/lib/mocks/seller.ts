import type { Shop } from "@/types";

/**
 * Mock seller shop fixture. Still used by the buyer Discover surface
 * (`DiscoverItem`) when surfacing organic ad creatives against a shop
 * lookup table — until the Discover endpoint embeds the shop, this
 * fills the gap. Everything else in this file (mock conversations,
 * messages, transactions, notifications) was removed during the Chat v1
 * cutover.
 */
export const MY_SHOP: Shop = {
  id: "s_me",
  name: "Chi's Closet",
  handle: "@chiscloset",
  verified: true,
  bio: "Curated Y2K, vintage, and modern pieces. Lagos-based, ship nationwide via GIG and DHL.",
  createdAt: "2025-01-15",
  totalSales: 24,
};
