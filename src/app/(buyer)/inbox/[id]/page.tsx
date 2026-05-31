import { AuthGate } from "@/components/AuthGate";
import { ChatThreadLoader } from "@/components/chat/ChatThreadLoader";

export const metadata = { title: "Conversation — Ahia" };

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  return (
    <AuthGate redirectTo="/login">
      <ChatThreadLoader id={id} perspective="buyer" inboxHref="/inbox" />
    </AuthGate>
  );
}
