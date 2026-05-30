import type { Metadata } from "next";

import { SellerProductsPanel } from "./_components/SellerProductsPanel";

export const metadata: Metadata = { title: "Products — Ahia Seller" };

export default function SellerProductsPage() {
  return <SellerProductsPanel />;
}
