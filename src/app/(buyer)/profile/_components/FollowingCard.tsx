"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

import { Typography } from "@/components/Typography";
import { useAuthStore } from "@/store/authStore";

/**
 * Quick card on /profile linking to /following. Shows the user's follow
 * count if backend has surfaced it (`followingCount` on /auth/me, Phase 7);
 * falls back to a CTA when the field is undefined.
 */
export function FollowingCard() {
  const user = useAuthStore((s) => s.user);
  const count = user?.followingCount;

  return (
    <Link
      href="/following"
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
    >
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
      >
        <Heart className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Typography variant="heading-h4">
          {typeof count === "number"
            ? count === 0
              ? "Not following any shops yet"
              : `Following ${count} ${count === 1 ? "shop" : "shops"}`
            : "Shops you follow"}
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Open a chat with any of them, any time.
        </Typography>
      </div>
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
