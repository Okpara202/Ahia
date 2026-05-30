import Link from "next/link";
import { ArrowRight, Flag } from "lucide-react";

import { Typography } from "@/components/Typography";

export function FoundingBanner() {
  return (
    <Link
      href="/signup?role=seller"
      className="group block w-full bg-foreground text-background transition-colors hover:bg-foreground/90"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-2 px-4 py-2 sm:gap-3 sm:px-6 lg:px-8">
        <Flag className="size-3.5 shrink-0 text-accent" aria-hidden />
        <Typography variant="caption" className="text-center">
          <span className="font-semibold">Founding cohort open.</span> First
          100 sellers get 3 months of Discover ads free.
        </Typography>
        <span className="inline-flex items-center gap-1 text-accent">
          <Typography variant="caption" className="font-semibold underline-offset-2 group-hover:underline">
            Reserve a spot
          </Typography>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
