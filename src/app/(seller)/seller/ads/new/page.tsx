import type { Metadata } from "next";

import { NewAdPanel } from "./_components/NewAdPanel";

export const metadata: Metadata = { title: "Create Discover ad — Ahia Seller" };

export default function CreateAdPage() {
  return <NewAdPanel />;
}
