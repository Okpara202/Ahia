import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { HeroVisual } from "./HeroVisual";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Layered mesh-gradient blobs for a modern, depth-y backdrop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[600px] rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 -z-10 size-[500px] rounded-full bg-accent/15 blur-3xl"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-7 px-4 py-16 text-center sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 backdrop-blur">
            <ShieldCheck className="size-3.5 text-primary" />
            <Typography variant="overline" className="text-primary">
              Protected on both sides
            </Typography>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 backdrop-blur">
            <MapPin className="size-3.5 text-accent" />
            <Typography variant="overline" className="text-muted-foreground">
              Live in 6 cities
            </Typography>
          </span>
        </div>

        <Typography variant="display-lg" className="max-w-3xl">
          Buy. Sell.{" "}
          <span className="bg-linear-to-br from-primary via-primary to-accent bg-clip-text text-transparent">
            Get paid safely.
          </span>
        </Typography>

        <Typography
          variant="body-lg"
          className="max-w-xl text-muted-foreground"
        >
          Ahia is the Nigerian marketplace where buyers and sellers finally
          trust each other. Money goes into escrow when a buyer pays — and
          releases to the seller once delivery is confirmed. No bad goods.
          No bad payers.
        </Typography>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Button asChild variant="cta" size="lg">
            <Link href="/feed">
              Start shopping
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup?role=seller">Open a shop</Link>
          </Button>
        </div>
        <Typography variant="caption" className="text-muted-foreground">
          Browse free — sign in only when you&apos;re ready to chat or check
          out.
        </Typography>

        <div className="mt-2 grid w-full max-w-2xl grid-cols-3 gap-6 sm:gap-10">
          <HeroStat value="₦0" label="Free to start" />
          <HeroStat value="100%" label="Protected payments" />
          <HeroStat value="60s" label="To open a shop" />
        </div>

        <div className="mt-6 w-full max-w-2xl">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="bg-linear-to-br from-primary to-primary/70 bg-clip-text font-heading text-3xl font-bold leading-none tracking-[-0.02em] tabular-nums text-transparent sm:text-4xl">
        {value}
      </span>
      <Typography variant="caption" className="text-muted-foreground">
        {label}
      </Typography>
    </div>
  );
}
