import { AuthGate } from "@/components/AuthGate";
import { MyStoriesLoader } from "./_components/MyStoriesLoader";

export const metadata = { title: "Your stories — Ahia Seller" };

export default function SellerStoriesPage() {
  return (
    <AuthGate redirectTo="/login">
      <MyStoriesLoader />
    </AuthGate>
  );
}
