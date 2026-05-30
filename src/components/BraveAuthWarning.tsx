"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";

import { Typography } from "@/components/Typography";
import { useIsBrave } from "@/hooks/useIsBrave";

const DISMISS_KEY = "ahia.braveBannerDismissed";

/**
 * Top banner shown only when the visitor is in Brave AND hasn't dismissed it
 * before. Warns specifically about Google sign-in: Brave's "Bounce tracking
 * protection" Shield detects the OAuth redirect chain
 * (frontend → backend → Google → backend → frontend) and drops the session
 * cookie set in the final redirect response. Manual email/password sign-in
 * is unaffected because it uses a direct POST, not a bounce chain.
 *
 * See CLAUDE.md §11c "Brave Shields and cross-site cookies" for full context.
 *
 * Dismiss is forever (localStorage). The auth interceptor is the safety net
 * for users who dismiss without using the email workaround — they still get
 * caught and routed to /help/sign-in-blocked.
 *
 * Remove this component when we migrate to app.ahia.ng + api.ahia.ng (shared
 * eTLD+1 means cookies are first-party and bounce-tracking doesn't apply).
 */
export function BraveAuthWarning() {
  const isBrave = useIsBrave();
  // Start "dismissed" so SSR/first-render shows nothing — prevents a flash of
  // the banner before we can read localStorage. The useEffect below flips it
  // to the real persisted value on the client.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Intentional set-state-in-effect: SSR has no access to localStorage, so
    // the initial render must paint as "dismissed" (banner hidden). After
    // mount we flip to the real persisted value. Same hydration-safety
    // pattern as useIsSaved.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (!isBrave || dismissed) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:px-6 lg:px-10"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-1 flex-col gap-1">
        <Typography variant="label-md">Using Brave?</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Brave&apos;s default Shields block{" "}
          <span className="font-medium text-foreground">Google sign-in</span>{" "}
          on sites like ours. Email sign-in works normally — use that instead,
          or lower Shields in the address bar.{" "}
          <Link
            href="/help/sign-in-blocked"
            className="font-medium text-primary hover:underline"
          >
            Learn more
          </Link>
          .
        </Typography>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss warning"
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
