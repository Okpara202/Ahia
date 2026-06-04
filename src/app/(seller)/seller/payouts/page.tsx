import { AuthGate } from "@/components/AuthGate";
import { PayoutsLoader } from "./_components/PayoutsLoader";

export const metadata = { title: "Payouts — Ahia Seller" };

export default function SellerPayoutsPage() {
  return (
    <AuthGate redirectTo="/login">
      <PayoutsLoader />
    </AuthGate>
  );
}
