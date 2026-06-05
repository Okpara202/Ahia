import type { Metadata } from "next";

import { AdAnalyticsLoader } from "./_components/AdAnalyticsLoader";

interface AdAnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Discover ad — Ahia Seller",
};

/**
 * Thin server shell. The post + analytics fetches are authed and have to
 * run in the browser — cross-origin SSR can't see the session cookie
 * (CLAUDE.md §11c). See [AdAnalyticsLoader](./_components/AdAnalyticsLoader.tsx).
 */
export default async function AdAnalyticsPage({ params }: AdAnalyticsPageProps) {
  const { id } = await params;
  return <AdAnalyticsLoader id={id} />;
}
