import type { Metadata } from "next";

import { SellerDashboard } from "./_components/SellerDashboard";

export const metadata: Metadata = { title: "Dashboard — Ahia Seller" };

export default function SellerDashboardPage() {
  return <SellerDashboard />;
}
