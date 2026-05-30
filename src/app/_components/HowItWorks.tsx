import { Compass, MessageCircle, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";

interface Step {
  icon: LucideIcon;
  step: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Compass,
    step: "01",
    title: "Discover",
    body: "Scroll a personalised feed of products from real shops across Nigeria — or search for exactly what you want.",
  },
  {
    icon: MessageCircle,
    step: "02",
    title: "Chat",
    body: "Message the seller, ask questions, agree a price — just like WhatsApp, but inside the app.",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Pay safely",
    body: "Buyer pays through Ahia. Money sits in escrow — then releases to the seller once delivery is confirmed.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Typography variant="overline" className="text-primary">
            How it works
          </Typography>
          <Typography variant="heading-h2" className="mt-3">
            Buy from real people, without the risk.
          </Typography>
          <Typography
            variant="body-md"
            className="mt-3 text-muted-foreground"
          >
            One flow that protects both sides. Buyers don&apos;t lose money on
            bad goods. Sellers don&apos;t lose product on bad payers.
          </Typography>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
          {STEPS.map(({ icon: Icon, step, title, body }) => (
            <div
              key={step}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <Typography
                  variant="overline"
                  className="text-muted-foreground"
                >
                  {step}
                </Typography>
              </div>
              <Typography variant="heading-h3">{title}</Typography>
              <Typography variant="body-md" className="text-muted-foreground">
                {body}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
