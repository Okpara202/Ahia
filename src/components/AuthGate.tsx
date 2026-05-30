"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageLoader } from "@/components/PageLoader";
import { useAuthStore } from "@/store/authStore";

interface AuthGateProps {
  /** Where to bounce guests. The current pathname is appended as `?next=`. */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Client-side auth gate. Required because Next.js SSR can't read the
 * backend's session cookie cross-origin — `getCurrentUser()` returns null
 * even for signed-in users until the user buys a shared domain. Gating in
 * the page or layout server-side would redirect signed-in users to /login.
 *
 * Renders a spinner while `StoreHydrator` is still reconciling, then either
 * renders children (signed-in) or pushes to `redirectTo` (confirmed guest).
 */
export function AuthGate({
  redirectTo = "/login",
  children,
}: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);

  useEffect(() => {
    if (!authReady) return;
    if (user) return;
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`${redirectTo}${next}`);
  }, [authReady, user, pathname, redirectTo, router]);

  if (!user) {
    return <PageLoader fullScreen={false} />;
  }

  return <>{children}</>;
}
