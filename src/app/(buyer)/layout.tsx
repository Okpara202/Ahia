import { StoreHydrator } from "@/components/StoreHydrator";
import { getConversations } from "@/lib/services/conversations";
import { getNotifications } from "@/lib/services/notifications";
import { getCurrentUser } from "@/lib/services/users";
import { BuyerBottomNav } from "./_components/BuyerBottomNav";
import { BuyerTopNav } from "./_components/BuyerTopNav";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guests can browse the buyer shell — only fetch inbox/notifications for
  // signed-in users so we don't trip a 401 from the public surface.
  const user = await getCurrentUser();
  const [conversations, notifications] = user
    ? await Promise.all([getConversations(), getNotifications()])
    : [[], []];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHydrator
        user={user}
        activeRole="buyer"
        conversations={conversations}
        notifications={notifications}
      />
      <BuyerTopNav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BuyerBottomNav />
    </div>
  );
}
