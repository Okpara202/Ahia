"use client";

import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

/**
 * Guard a buyer-side action that requires an account.
 *
 * Usage:
 *   const requireAuth = useRequireAuth();
 *   function handleChat() {
 *     if (!requireAuth("to message the shop")) return;
 *     // ...real work
 *   }
 *
 * If the user is signed in, returns true and the caller proceeds.
 * Otherwise it toasts a hint, redirects to `/signup?next=<current path>`, and
 * returns false. After signup → onboarding the user lands back where they were.
 */
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();

  return function requireAuth(intent?: string): boolean {
    const isAuthed = useAuthStore.getState().isAuthed;
    if (isAuthed) return true;

    const next = encodeURIComponent(pathname);
    toast.info(
      "Sign in to continue",
      intent ? `Quick account — needed ${intent}.` : undefined
    );
    router.push(`/signup?next=${next}`);
    return false;
  };
}
