import {
  BadgeCheck,
  MessageSquare,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";

interface Benefit {
  icon: LucideIcon;
  title: string;
  body: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: ShieldCheck,
    title: "Escrow on every order",
    body: "Your money sits with us — not the seller — until you confirm the goods arrived as agreed.",
  },
  {
    icon: BadgeCheck,
    title: "Real shops, not anonymous DMs",
    body: "Every shop has a name, photo, products, and a history of completed sales. You always know who you're buying from.",
  },
  {
    icon: MessageSquare,
    title: "Chat before you pay",
    body: "Negotiate, ask for more photos, agree delivery — exactly how you already shop on WhatsApp.",
  },
  {
    icon: Undo2,
    title: "Refunds, not arguments",
    body: "Got the wrong item? Raise a dispute. Our team reviews the chat and returns your money if you're in the right.",
  },
];

export function ForBuyers() {
  return (
    <section>
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="flex flex-col gap-3 md:max-w-2xl">
          <Typography variant="overline" className="text-primary">
            For buyers
          </Typography>
          <Typography variant="heading-h2">
            Buy with the confidence WhatsApp can&apos;t give you.
          </Typography>
          <Typography variant="body-md" className="text-muted-foreground">
            All the convenience of buying from someone&apos;s DM — without the
            &ldquo;will I actually get this?&rdquo; anxiety.
          </Typography>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <Typography variant="heading-h4">{title}</Typography>
              <Typography variant="body-sm" className="text-muted-foreground">
                {body}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
