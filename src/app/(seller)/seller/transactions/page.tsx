import type { Metadata } from "next";

import { SellerTransactionsPanel } from "./_components/SellerTransactionsPanel";

export const metadata: Metadata = { title: "Transactions — Ahia Seller" };

export default function SellerTransactionsPage() {
  return <SellerTransactionsPanel />;
}
