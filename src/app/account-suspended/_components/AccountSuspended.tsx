"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";

/**
 * Landing page shown when the backend returns `403 account_suspended`.
 * The auth interceptor redirects here with the reason in `?reason=...`
 * (and any backend-provided requestId in `?ref=...`).
 *
 * Page is intentionally guest-shaped — by the time the user lands here,
 * the interceptor has already cleared local auth state. There's no auth
 * gate; they can't sign back in unless the suspension is lifted.
 */
export function AccountSuspended() {
  const params = useSearchParams();
  const reason = params.get("reason");
  const requestId = params.get("ref");

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span
        aria-hidden
        className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive"
      >
        <ShieldAlert className="size-7" />
      </span>
      <div className="flex flex-col gap-2">
        <Typography variant="heading-h2">Account suspended</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          {reason ??
            "Your account has been suspended by Ahia. You can't sign in or use the app until this is resolved."}
        </Typography>
        {requestId && (
          <Typography
            variant="caption"
            className="select-all font-mono text-muted-foreground/70"
          >
            ID: {requestId}
          </Typography>
        )}
      </div>
      <div className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-left">
        <Typography variant="label-md">Think this is a mistake?</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Email{" "}
          <a
            href="mailto:support@ahia.ng"
            className="text-primary underline-offset-4 hover:underline"
          >
            support@ahia.ng
          </a>{" "}
          with your account email and a short note. A human reviews every
          appeal.
        </Typography>
      </div>
      <Button asChild variant="outline" size="lg">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
