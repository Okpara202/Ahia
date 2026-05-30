"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, ShoppingBag, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { apiClient, extractApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import type { UserRole } from "@/types";
import { RoleCard } from "./RoleCard";

interface RoleOption {
  id: UserRole;
  icon: LucideIcon;
  title: string;
  body: string;
}

const ROLES: RoleOption[] = [
  {
    id: "buyer",
    icon: ShoppingBag,
    title: "I want to buy",
    body: "Browse shops, chat with sellers, pay safely with escrow.",
  },
  {
    id: "seller",
    icon: Store,
    title: "I want to sell",
    body: "Open a shop, list products, get paid through escrow. You can still buy too.",
  },
];

const ROUTE_BY_ROLE: Record<UserRole, string> = {
  buyer: "/feed",
  // /seller will fall through to the OpenShopForm via SellerShellGate when
  // the user has no shop yet (i.e. every new seller).
  seller: "/seller",
};

function parseRoleHint(value: string | null): UserRole | null {
  return value === "buyer" || value === "seller" ? value : null;
}

export function OnboardingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next");
  const [role, setRole] = useState<UserRole | null>(() =>
    parseRoleHint(params.get("role"))
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canContinue = role !== null && acceptedTerms;

  async function handleContinue() {
    if (!canContinue || !role) return;
    setSubmitting(true);
    try {
      await apiClient().patch("/users/role", { role });
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, role } : s.user,
        activeRole: role,
      }));
      router.push(nextPath ?? ROUTE_BY_ROLE[role]);
    } catch (err) {
      console.warn("[onboarding] role save failed", {
        error: err,
        apiErr: extractApiError(err),
      });
      toast.error(
        "Couldn't save your role",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-col gap-3"
        role="radiogroup"
        aria-label="Pick a starting role"
      >
        {ROLES.map((option) => (
          <RoleCard
            key={option.id}
            icon={option.icon}
            title={option.title}
            body={option.body}
            selected={role === option.id}
            onSelect={() => setRole(option.id)}
          />
        ))}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/40">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <Typography variant="body-sm" className="text-muted-foreground">
          I agree to the{" "}
          <Link
            href="/legal/terms"
            className="font-medium text-primary hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="font-medium text-primary hover:underline"
          >
            Privacy Policy
          </Link>
          . I understand all payments must go through Ahia — off-platform
          payments are not protected.
        </Typography>
      </label>

      <Button
        onClick={handleContinue}
        variant="cta"
        size="lg"
        className="w-full"
        disabled={!canContinue || submitting}
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "Setting things up…" : "Continue"}
        {!submitting && <ArrowRight className="size-4" />}
      </Button>
    </div>
  );
}
