"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, PauseCircle } from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { Logo } from "@/components/Logo";
import { OpenShopForm } from "@/components/OpenShopForm";
import { PageLoader } from "@/components/PageLoader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { getMyShop, reopenShop } from "@/lib/services/seller";
import { useAuthStore } from "@/store/authStore";
import { useSellerShopStore } from "@/store/sellerShopStore";
import { toast } from "@/store/toastStore";
import type { Shop } from "@/types";
import { SellerShell } from "./SellerShell";

interface SellerShellGateProps {
  children: React.ReactNode;
}

/**
 * Gates the seller shell client-side. SSR can't read the backend cookie
 * cross-origin so we can't redirect or fetch /shops/me from a server
 * component without 401-ing every signed-in user.
 *
 * Three states once auth is confirmed:
 *  1. No shop                     → render `OpenShopForm` so they can create one
 *  2. Shop, `isActive: false`     → render `PausedShopState` with explicit Reopen
 *                                   action (no silent role flip — `isActive` is
 *                                   the canonical signal post Phase 2)
 *  3. Shop, `isActive: true`      → render the seller shell + children
 */
export function SellerShellGate({ children }: SellerShellGateProps) {
  return (
    <AuthGate redirectTo="/login">
      <SellerShellWithShop>{children}</SellerShellWithShop>
    </AuthGate>
  );
}

function SellerShellWithShop({ children }: SellerShellGateProps) {
  const user = useAuthStore((s) => s.user);
  // Subscribe to the store directly so the shell reacts when OpenShopForm
  // creates a shop (it calls setShop on success). Local state only tracks
  // whether the initial fetch has settled, not the shop itself.
  const shop = useSellerShopStore((s) => s.shop);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyShop()
      .then((fetched) => {
        if (cancelled) return;
        useSellerShopStore.getState().setShop(fetched);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!loaded || !user) {
    return <PageLoader label="Setting up your shop…" fullScreen={false} />;
  }

  if (!shop) {
    return <NoShopFallback />;
  }

  // `isActive === false` is the canonical paused signal. Undefined (old
  // backend response shape) is treated as active so the shell still renders.
  if (shop.isActive === false) {
    return <PausedShopState shop={shop} />;
  }

  return (
    <SellerShell shopName={shop.name} shopHandle={shop.handle}>
      {children}
    </SellerShell>
  );
}

/**
 * Shown to a logged-in user who landed on the seller shell without a shop
 * yet. Renders the OpenShopForm with a minimal header/footer — no sidebar,
 * because there's nothing to navigate to yet.
 */
function NoShopFallback() {
  return (
    <MinimalShell>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:px-6 sm:py-14">
        <OpenShopForm />
      </main>
    </MinimalShell>
  );
}

/**
 * Shown when the user has a shop but `shop.isActive === false` — they
 * deliberately paused. Backend's visibility filter hides their shop from
 * /feed and /search until they reopen, and rejects new conversation /
 * transaction starts against them. Existing chats and orders are intact.
 *
 * Reopening is an explicit action — no silent recovery.
 */
function PausedShopState({ shop }: { shop: Shop }) {
  const [working, setWorking] = useState(false);

  async function handleReopen() {
    if (working) return;
    setWorking(true);
    try {
      const updated = await reopenShop();
      useSellerShopStore.getState().setShop(updated);
      toast.confirm(
        "Welcome back",
        "Your shop is live again. Buyers can find you in the feed."
      );
    } catch (err) {
      toast.error(
        "Couldn't reopen your shop",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
      setWorking(false);
    }
  }

  return (
    <MinimalShell>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <span
            aria-hidden
            className="grid size-14 place-items-center rounded-2xl bg-warning/15 text-warning"
          >
            <PauseCircle className="size-7" strokeWidth={2.25} />
          </span>
          <div className="flex flex-col gap-1.5">
            <Typography variant="heading-h2">Your shop is paused</Typography>
            <Typography variant="body-sm" className="text-muted-foreground">
              <span className="font-medium text-foreground">{shop.name}</span>{" "}
              is hidden from the buyer feed and search. Your products,
              conversations, transactions, and reviews stay safe — reopen any
              time.
            </Typography>
          </div>
          <Button
            type="button"
            variant="cta"
            size="lg"
            onClick={handleReopen}
            disabled={working}
            className="w-full"
          >
            {working && <Loader2 className="size-4 animate-spin" />}
            {working ? "Reopening…" : "Reopen my shop"}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/feed">
              <ArrowLeft className="size-4" />
              Back to feed
            </Link>
          </Button>
        </div>
      </main>
    </MinimalShell>
  );
}

function MinimalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
        <Link href="/feed" aria-label="Ahia home" className="flex items-center">
          <Logo variant="full" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/feed">
              <ArrowLeft className="size-4" />
              Back to feed
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
