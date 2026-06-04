import { AuthGate } from "@/components/AuthGate";
import { FollowingListLoader } from "./_components/FollowingListLoader";

export const metadata = { title: "Following — Ahia" };

export default function FollowingPage() {
  return (
    <AuthGate redirectTo="/login">
      <FollowingListLoader />
    </AuthGate>
  );
}
