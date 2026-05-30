import { ChatThreadLoader } from "@/components/chat/ChatThreadLoader";

export const metadata = { title: "Conversation — Ahia Seller" };

interface SellerChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function SellerChatPage({ params }: SellerChatPageProps) {
  const { id } = await params;
  return (
    <ChatThreadLoader
      id={id}
      perspective="seller"
      inboxHref="/seller/inbox"
    />
  );
}
