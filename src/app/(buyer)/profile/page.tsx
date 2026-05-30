import type { Metadata } from "next";

import { AuthGate } from "@/components/AuthGate";
import { ProfileContent } from "./_components/ProfileContent";

export const metadata: Metadata = { title: "Profile — Ahia" };

export default function ProfilePage() {
  return (
    <AuthGate redirectTo="/login">
      <ProfileContent />
    </AuthGate>
  );
}
