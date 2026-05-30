import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";

export const metadata = { title: "Sign in required — Ahia" };

export default function UnauthorizedPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span
          aria-hidden
          className="grid size-20 place-items-center rounded-3xl bg-warning/15 text-warning"
        >
          <Lock className="size-9" />
        </span>
        <Typography variant="heading-h1" className="mt-6">
          Sign in to continue
        </Typography>
        <Typography variant="body-md" className="mt-2 text-muted-foreground">
          You need an account to view this page. Conversations, transactions,
          and your shop are private to you.
        </Typography>

        <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="cta" size="lg" className="sm:flex-1">
            <Link href="/login">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="sm:flex-1">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>

        <Typography variant="caption" className="mt-6 text-muted-foreground">
          Just browsing?{" "}
          <Link href="/feed" className="text-primary hover:underline">
            Back to the feed
          </Link>
        </Typography>
      </div>
    </div>
  );
}
