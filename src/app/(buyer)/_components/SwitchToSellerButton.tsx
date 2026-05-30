"use client";

import Link from "next/link";
import { Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

/**
 * Top-nav CTA that takes the user to the seller shell.
 *
 * Wording is context-aware:
 *  - role === "seller" → "My shop" (familiar destination)
 *  - role === "buyer"  → "Sell" (transformative; OpenShopForm at /seller
 *    handles the role flip atomically with shop creation)
 *
 * Does NOT call `PATCH /users/role` here. The role flip is owned by
 * `OpenShopForm` (atomic with shop creation) and `SellerShellGate`
 * (auto-flip for returning sellers with an existing shop).
 */
export function SwitchToSellerButton() {
  const role = useAuthStore((s) => s.user?.role);
  const label = role === "seller" ? "My shop" : "Open a shop";

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="hidden lg:inline-flex"
    >
      <Link href="/seller">
        <Store className="size-4" />
        {label}
      </Link>
    </Button>
  );
}
