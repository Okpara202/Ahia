import { StoreHydrator } from "@/components/StoreHydrator";
import { getConversations } from "@/lib/services/conversations";
import { getNotifications } from "@/lib/services/notifications";
import { getCurrentUser } from "@/lib/services/users";
import { SellerShellGate } from "./_components/SellerShellGate";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Don't redirect on null user — SSR can't see the backend's session
  // cookie cross-origin, so signed-in users come through as null here.
  // SellerShellGate handles auth client-side once StoreHydrator has had a
  // chance to reconcile via /auth/me.
  const user = await getCurrentUser();
  const [conversations, notifications] = user
    ? await Promise.all([getConversations(), getNotifications()])
    : [[], []];

  return (
    <>
      <StoreHydrator
        user={user}
        activeRole="seller"
        conversations={conversations}
        notifications={notifications}
      />
      <SellerShellGate>{children}</SellerShellGate>
    </>
  );
}
