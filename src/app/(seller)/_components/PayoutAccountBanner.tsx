"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Wallet, X } from "lucide-react";

import { Typography } from "@/components/Typography";
import { useAuthStore } from "@/store/authStore";

const DISMISS_KEY = "ahia:payout-banner:dismissed";

/**
 * Reminder banner shown to sellers who haven't added a payout account yet.
 * Dismissible per session (the user closes it, it stays closed until they
 * reopen the browser). Reads `user.hasPayoutAccount` from the auth store —
 * once they add an account, the banner self-removes on the next /auth/me
 * reconcile. Renders nothing while authReady is false, when there's no
 * user, or when the account is already on file.
 */
export function PayoutAccountBanner() {
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!authReady || !user) return null;
  // hasPayoutAccount is undefined until backend ships the field — treat
  // undefined as "we don't know yet, don't nag" to avoid false positives.
  if (user.hasPayoutAccount !== false) return null;
  if (dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 md:mx-6 md:mt-6">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/20 text-accent"
      >
        <Wallet className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Typography variant="label-md">
          Add a payout account so we can send you money
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Funds released by your buyers will queue up until you add a bank
          account. Takes 30 seconds.
        </Typography>
        <Link
          href="/seller/shop"
          className="inline-flex w-fit items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <Typography variant="label-sm">Add payout account</Typography>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss for this session"
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
