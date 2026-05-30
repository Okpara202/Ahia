import { Banknote, Globe2, Store, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";

interface Benefit {
  icon: LucideIcon;
  title: string;
  body: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: Wallet,
    title: "Get paid up-front",
    body: "Buyers pay before you ship. Money is locked in escrow on your behalf — no more chasing “I’ll transfer tomorrow.”",
  },
  {
    icon: Globe2,
    title: "Reach beyond your contacts",
    body: "Buyers from every city and campus discover your shop through the feed and search — not just the people who already follow you.",
  },
  {
    icon: Store,
    title: "A storefront, not a DM",
    body: "A real shop page with your products, your photos, your history. Builds trust without you doing the convincing.",
  },
  {
    icon: Banknote,
    title: "Free to start. No listing fees.",
    body: "Open a shop in 60 seconds. List as many products as you want. We only take a small cut when a sale completes.",
  },
];

export function ForSellers() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="flex flex-col gap-3 md:max-w-2xl">
          <Typography variant="overline" className="text-accent">
            For sellers
          </Typography>
          <Typography variant="heading-h2">
            Sell like a business, not a contact.
          </Typography>
          <Typography variant="body-md" className="text-muted-foreground">
            Stop pleading with strangers to trust you. Open a shop, list your
            products, and let escrow do the convincing.
          </Typography>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-accent/10 text-accent">
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
