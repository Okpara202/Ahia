"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";

/**
 * Compact "Pending payout" tile on the seller dashboard. Reads
 * `user.owedBalance` from the auth store; renders nothing when there's
 * nothing owed (clean dashboard for sellers who just settled). Links to
 * `/seller/payouts` for the full breakdown + Cash out now button.
 */
export function OwedBalanceTile() {
  const user = useAuthStore((s) => s.user);
  const owed = Number(user?.owedBalance ?? "0");
  if (owed <= 0) return null;

  return (
    <Link
      href="/seller/payouts"
      className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/3 p-5 transition-colors hover:bg-primary/6"
    >
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
      >
        <Zap className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Typography variant="overline" className="text-primary">
          Pending payout
        </Typography>
        <Typography
          variant="heading-h2"
          className="font-mono tabular-nums text-foreground"
        >
          {formatNaira(owed)}
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Next sweep tomorrow 6 AM — or cash out now.
        </Typography>
      </div>
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
