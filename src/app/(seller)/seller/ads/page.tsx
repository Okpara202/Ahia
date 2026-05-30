import type { Metadata } from "next";

import { AdsPanel } from "./_components/AdsPanel";

export const metadata: Metadata = { title: "Ads — Ahia Seller" };

export default function SellerAdsPage() {
  return <AdsPanel />;
}
