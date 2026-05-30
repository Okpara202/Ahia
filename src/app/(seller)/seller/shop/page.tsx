import type { Metadata } from "next";

import { ShopSettings } from "./_components/ShopSettings";

export const metadata: Metadata = { title: "Shop settings — Ahia Seller" };

export default function SellerShopPage() {
  return <ShopSettings />;
}
