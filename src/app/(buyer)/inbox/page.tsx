import { InboxListClient } from "@/components/chat/InboxListClient";

export const metadata = { title: "Inbox — Ahia" };

export default function InboxPage() {
  return (
    <InboxListClient
      basePath="/inbox"
      heading="Inbox"
      emptyTitle="Nothing here yet"
      emptyBody='Find something you like in the feed and tap "Message the shop." Your conversations will land here.'
    />
  );
}
