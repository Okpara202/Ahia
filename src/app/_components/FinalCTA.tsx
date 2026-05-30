import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";

export function FinalCTA() {
  return (
    <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10 md:py-16 lg:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-accent/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-4">
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-3 py-1 backdrop-blur">
              <Sparkles className="size-3.5" />
              <Typography variant="overline">Get started</Typography>
            </span>
            <Typography variant="heading-h1">
              Whether you&apos;re buying or selling — Ahia has your back.
            </Typography>
            <Typography
              variant="body-lg"
              className="text-primary-foreground/80"
            >
              Free to join. Money protected. Real people. Start in 60 seconds.
            </Typography>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:shrink-0">
            <Button asChild variant="cta" size="lg">
              <Link href="/feed">
                Start shopping
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:border-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/signup?role=seller">Open a shop</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
