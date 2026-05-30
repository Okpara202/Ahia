import Link from "next/link";

import { Logo } from "@/components/Logo";
import { Typography } from "@/components/Typography";

interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    heading: "Marketplace",
    links: [
      { label: "Browse", href: "/search" },
      { label: "Categories", href: "/search" },
      { label: "Verified shops", href: "/search?verified=1" },
    ],
  },
  {
    heading: "For sellers",
    links: [
      { label: "Open a shop", href: "/signup?role=seller" },
      { label: "Seller fees", href: "/help/fees" },
      { label: "Get paid", href: "/help/payouts" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "How escrow works", href: "/help/escrow" },
      { label: "Raise a dispute", href: "/help/disputes" },
      { label: "Contact us", href: "/help/contact" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-3">
            <Link href="/" aria-label="Ahia home">
              <Logo variant="full" />
            </Link>
            <Typography
              variant="body-sm"
              className="max-w-xs text-muted-foreground"
            >
              Nigeria&apos;s marketplace for buyers and sellers — protected by
              escrow on every transaction.
            </Typography>
          </div>

          {COLUMNS.map(({ heading, links }) => (
            <div key={heading} className="flex flex-col gap-3">
              <Typography variant="overline" className="text-muted-foreground">
                {heading}
              </Typography>
              <ul className="flex flex-col gap-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-foreground transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <Typography variant="caption" className="text-muted-foreground">
            © {new Date().getFullYear()} Ahia. Made for Nigerian sellers.
          </Typography>
          <div className="flex gap-4">
            <Link
              href="/legal/terms"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
