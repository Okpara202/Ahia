import { AuthGate } from "@/components/AuthGate";
import { FollowersListLoader } from "./_components/FollowersListLoader";

export const metadata = { title: "Followers — Ahia Seller" };

export default function SellerFollowersPage() {
  return (
    <AuthGate redirectTo="/login">
      <FollowersListLoader />
    </AuthGate>
  );
}
