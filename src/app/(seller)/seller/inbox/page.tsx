import { InboxListClient } from "@/components/chat/InboxListClient";

export const metadata = { title: "Inbox — Ahia Seller" };

export default function SellerInboxPage() {
  return (
    <InboxListClient
      perspective="seller"
      basePath="/seller/inbox"
      heading="Inbox"
      emptyTitle="Quiet for now"
      emptyBody="When a buyer messages you about a product, the conversation will land right here."
    />
  );
}
