import { InboxListClient } from "@/components/chat/InboxListClient";

export const metadata = { title: "Inbox — Ahia" };

interface InboxPageProps {
  searchParams: Promise<{ product?: string; shop?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const { product, shop } = await searchParams;
  return (
    <InboxListClient
      perspective="buyer"
      basePath="/inbox"
      heading="Inbox"
      emptyTitle="Nothing here yet"
      emptyBody='Find something you like in the feed and tap "Message the shop." Your conversations will land here.'
      productDeepLink={product}
      shopDeepLink={shop}
    />
  );
}
