import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Typography } from "@/components/Typography";

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:w-1/2 lg:p-12 xl:p-16">
      <BackgroundAccents />

      <Link href="/" aria-label="Ahia home" className="relative z-10">
        <Logo variant="full" inverted />
      </Link>

      <div className="relative z-10 flex flex-col gap-6">
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-primary-foreground/15 px-3 py-1 backdrop-blur">
          <ShieldCheck className="size-3.5" />
          <Typography variant="overline">Protected on both sides</Typography>
        </span>

        <Typography variant="display-md" className="max-w-md">
          Buy. Sell. Get paid safely.
        </Typography>

        <Typography
          variant="body-lg"
          className="max-w-md text-primary-foreground/80"
        >
          Money sits in escrow until delivery is confirmed. Buyers don&apos;t
          lose money on bad goods. Sellers don&apos;t lose product on bad
          payers.
        </Typography>

        <EscrowProofCard />

        <div className="flex items-center gap-6 pt-2">
          <Stat value="₦0" label="Free to start" />
          <span className="h-8 w-px bg-primary-foreground/20" />
          <Stat value="100%" label="Protected" />
          <span className="h-8 w-px bg-primary-foreground/20" />
          <Stat value="60s" label="To open a shop" />
        </div>
      </div>

      <Typography
        variant="caption"
        className="relative z-10 text-primary-foreground/60"
      >
        Real shops. Real chat. Protected money — for buyers and sellers across
        Nigeria.
      </Typography>
    </aside>
  );
}

function BackgroundAccents() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-primary-foreground/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-foreground)_0%,transparent_60%)] opacity-[0.04]"
      />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <Typography variant="heading-h4">{value}</Typography>
      <Typography variant="caption" className="text-primary-foreground/60">
        {label}
      </Typography>
    </div>
  );
}

function EscrowProofCard() {
  return (
    <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 place-items-center rounded-full bg-success/25"
        >
          <Check className="size-5" strokeWidth={3} />
        </span>
        <div className="flex flex-col">
          <Typography variant="label-md">Payment held in escrow</Typography>
          <Typography variant="caption" className="text-primary-foreground/70">
            Releases when buyer confirms delivery
          </Typography>
        </div>
        <Typography variant="price-md" className="ml-auto whitespace-nowrap">
          ₦45,000
        </Typography>
      </div>
    </div>
  );
}
