import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Typography } from "@/components/Typography";

export const metadata = {
  title: "How Ahia escrow works — Ahia",
  description:
    "Your money sits with Ahia until you confirm the package arrived. If it never does, you get a refund.",
};

export default function EscrowHelpPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Link
        href="/feed"
        className="inline-flex w-fit items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <Typography variant="label-sm">Back to feed</Typography>
      </Link>

      <header className="flex flex-col gap-3">
        <span
          aria-hidden
          className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground"
        >
          <ShieldCheck className="size-7" />
        </span>
        <Typography variant="heading-h1">How Ahia escrow works</Typography>
        <Typography variant="body-lg" className="text-muted-foreground">
          Buying from someone you&apos;ve never met online is scary. Ahia removes
          the scary part: your money never reaches the seller until you say so.
        </Typography>
      </header>

      <section className="flex flex-col gap-4">
        <Typography variant="heading-h3">The four steps</Typography>
        <ol className="flex flex-col gap-4">
          <Step
            n={1}
            icon={CreditCard}
            title="You pay through Ahia"
            body="When you and the seller agree on a price in chat, the seller sends a payment request. You tap Pay and finish checkout via Paystack — same as buying from any normal Nigerian site."
          />
          <Step
            n={2}
            icon={Wallet}
            title="We hold your money"
            body="The payment doesn't reach the seller. It sits in Ahia's escrow account, frozen, until something happens next."
          />
          <Step
            n={3}
            icon={PackageCheck}
            title="The seller ships, you receive"
            body="Seller sends the item. You receive it, check it matches what you were promised."
          />
          <Step
            n={4}
            icon={CheckCircle2}
            title="You confirm — money releases"
            body="In the chat, tap Confirm delivery. Funds release to the seller, minus Ahia's small platform fee. You both get a notification."
          />
        </ol>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <Typography variant="heading-h4" className="text-primary">
          What if something goes wrong?
        </Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          If the package never arrives, arrives broken, or isn&apos;t what was
          promised, open a dispute from the chat. The money stays frozen while
          our team reviews chat history and any evidence you upload. If we side
          with you, you get a refund.
        </Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          If you don&apos;t confirm or dispute within seven days, funds
          auto-release — so don&apos;t forget that step.
        </Typography>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
        <Typography variant="heading-h4" className="text-destructive">
          Pay outside Ahia, you&apos;re on your own
        </Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          If a seller asks you to send money to their bank account directly,
          that&apos;s an instant red flag. We can&apos;t protect a transaction
          we never saw. Report any seller who asks for off-platform payment.
        </Typography>
      </section>

      <Typography variant="caption" className="text-muted-foreground">
        Questions? Reach support inside the app or email{" "}
        <Link
          href="mailto:hello@ahia.ng"
          className="text-primary hover:underline"
        >
          hello@ahia.ng
        </Link>
        .
      </Typography>
    </div>
  );
}

interface StepProps {
  n: number;
  icon: typeof CheckCircle2;
  title: string;
  body: string;
}

function Step({ n, icon: Icon, title, body }: StepProps) {
  return (
    <li className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
      <span
        aria-hidden
        className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
      >
        <Icon className="size-5" />
        <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <Typography variant="label-sm" className="font-bold">
            {n}
          </Typography>
        </span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Typography variant="heading-h4">{title}</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          {body}
        </Typography>
      </div>
    </li>
  );
}
