"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await apiClient().post("/auth/logout");
    } catch {
      // Backend already clears the cookie on 401 / network failure is OK to
      // ignore — the local sign-out below still lands the user as a guest.
    }
    disconnectSocket();
    useAuthStore.getState().signOut();
    toast.success("Signed out");
    router.push("/");
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleSignOut}
      disabled={signingOut}
    >
      {signingOut ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      {signingOut ? "Signing out…" : "Sign out"}
    </Button>
  );
}
