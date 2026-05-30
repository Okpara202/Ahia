import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";

export const metadata = { title: "Not found — Ahia" };

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span
          aria-hidden
          className="grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary"
        >
          <Compass className="size-9" />
        </span>
        <Typography variant="display-md" className="mt-6 text-foreground">
          404
        </Typography>
        <Typography variant="heading-h2" className="mt-2">
          We couldn&apos;t find that page
        </Typography>
        <Typography variant="body-md" className="mt-2 text-muted-foreground">
          The link may be old, the product was taken down, or the shop is no
          longer active. Try a fresh search or head back to the feed.
        </Typography>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="cta" size="lg">
            <Link href="/feed">
              <Home className="size-4" />
              Back to feed
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/search">
              <Search className="size-4" />
              Search Ahia
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
