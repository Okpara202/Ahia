import { Quote, Star } from "lucide-react";

import { Typography } from "@/components/Typography";

interface Testimonial {
  quote: string;
  name: string;
  context: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I went from selling 3 things a week on my WhatsApp status to 18 a month here. Buyers actually trust the shop page, not just my face.",
    name: "Chidera, 22",
    context: "Thrift shop · Lagos",
    rating: 5,
  },
  {
    quote:
      "Bought a vintage dress from a girl at OAU. Money sat in escrow till it landed at my hostel. No drama, no \"have you sent the alert?\".",
    name: "Tomi, 20",
    context: "Buyer · Ife",
    rating: 5,
  },
  {
    quote:
      "Discover put my food cart in front of girls in three campuses I'd never reached. ₦5k boost paid for itself in two days.",
    name: "Femi, 24",
    context: "Snacks · Ibadan",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="flex flex-col gap-3 md:max-w-2xl">
          <Typography variant="overline" className="text-primary">
            Real users
          </Typography>
          <Typography variant="heading-h2">
            Buyers and sellers, finally on the same page.
          </Typography>
          <Typography variant="body-md" className="text-muted-foreground">
            A few words from people running shops and shopping on Ahia today.
          </Typography>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6"
            >
              <Quote
                className="size-6 text-primary/40"
                aria-hidden
                strokeWidth={2.5}
              />
              <blockquote>
                <Typography variant="body-md">{t.quote}</Typography>
              </blockquote>
              <div className="mt-auto flex items-end justify-between gap-3">
                <figcaption className="flex flex-col">
                  <Typography variant="label-md">{t.name}</Typography>
                  <Typography variant="caption" className="text-muted-foreground">
                    {t.context}
                  </Typography>
                </figcaption>
                <div
                  className="flex items-center gap-0.5 text-accent"
                  aria-label={`${t.rating} out of 5 stars`}
                >
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </figure>
          ))}
        </div>

        <div className="mx-auto mt-14 grid w-full max-w-4xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat value="1,400+" label="Shops onboarded" />
          <Stat value="6,800+" label="Orders shipped" />
          <Stat value="₦0" label="Lost to bad payers" />
          <Stat value="6" label="Cities live" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-7">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
      />
      <span className="bg-linear-to-br from-primary to-primary/60 bg-clip-text font-heading text-3xl font-bold leading-none tracking-[-0.02em] tabular-nums text-transparent sm:text-4xl lg:text-5xl">
        {value}
      </span>
      <Typography variant="caption" className="text-muted-foreground">
        {label}
      </Typography>
    </div>
  );
}
