import Link from "next/link";

import { Typography } from "@/components/Typography";

interface QA {
  q: string;
  a: React.ReactNode;
}

const FAQS: QA[] = [
  {
    q: "How does escrow actually protect me?",
    a: (
      <>
        When you pay, the money goes to Ahia — not the seller. The seller ships
        knowing payment is locked in. You tap{" "}
        <strong className="text-foreground">&ldquo;Confirm delivery&rdquo;</strong>{" "}
        only after the item arrives in the condition agreed. That&apos;s when
        funds release to the seller.{" "}
        <Link
          href="/help/escrow"
          className="text-primary underline-offset-4 hover:underline"
        >
          Walk-through →
        </Link>
      </>
    ),
  },
  {
    q: "How long does my money sit in escrow?",
    a: "From payment until you confirm delivery — typically a few days. If you don't confirm or dispute within 7 days of delivery, funds auto-release to the seller.",
  },
  {
    q: "What does Ahia cost?",
    a: "Free to open a shop. Free to list. Free to chat. We take 5% of every completed transaction, automatically. Sellers who want extra reach can buy Discover ads from ₦5,000/month — no obligation.",
  },
  {
    q: "What if the buyer never confirms?",
    a: "If 7 days pass after delivery with no confirmation and no dispute, funds auto-release to you. No need to chase.",
  },
  {
    q: "What about delivery — who handles it?",
    a: "Today, buyer and seller agree on dispatch inside chat. We're adding GIG / Kwik / Gokada / Sendbox quotes directly in the conversation so you can book without leaving Ahia.",
  },
  {
    q: "Is my chat private?",
    a: "Yes. Only you and the other party can read your messages. Ahia staff only access chat history when a formal dispute is opened for that specific transaction — and only the messages relevant to it.",
  },
  {
    q: "What happens if I get the wrong item?",
    a: (
      <>
        Tap <strong className="text-foreground">Raise dispute</strong> on the
        transaction. Our team reviews the chat history and any evidence you
        upload, then decides on a refund or release. Most disputes resolve
        within 48 hours.
      </>
    ),
  },
  {
    q: "Can I sell things other than what's on my product list?",
    a: "Yes — once you're chatting with a buyer, you can negotiate anything inside the conversation. The seller sends a payment request with the agreed price; the buyer pays through Ahia just like any other order.",
  },
];

export function FAQ() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="flex flex-col gap-3 text-center">
          <Typography variant="overline" className="text-primary">
            Questions
          </Typography>
          <Typography variant="heading-h2">Things people ask us.</Typography>
          <Typography variant="body-md" className="text-muted-foreground">
            If yours isn&apos;t here, email{" "}
            <a
              href="mailto:hello@ahia.ng"
              className="font-medium text-primary hover:underline"
            >
              hello@ahia.ng
            </a>{" "}
            — a human reads every one.
          </Typography>
        </div>

        <div className="mt-10 flex flex-col gap-2">
          {FAQS.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-border bg-background p-5 transition-colors open:bg-muted/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <Typography variant="label-lg">{item.q}</Typography>
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-transform group-open:rotate-45"
                >
                  <span className="text-lg leading-none">+</span>
                </span>
              </summary>
              <div className="mt-3">
                <Typography variant="body-md" className="text-muted-foreground">
                  {item.a}
                </Typography>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
