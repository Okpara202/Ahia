import Link from "next/link";

import { BraveAuthWarning } from "@/components/BraveAuthWarning";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Typography } from "@/components/Typography";
import { AuthBrandPanel } from "./_components/AuthBrandPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AuthBrandPanel />

      <div className="relative flex flex-1 flex-col">
        <BraveAuthWarning />
        <header className="flex items-center justify-between px-4 py-4 sm:px-6 lg:justify-end lg:px-10 lg:py-6">
          <Link href="/" aria-label="Ahia home" className="lg:hidden">
            <Logo variant="full" />
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </main>

        <footer className="px-4 pb-6 sm:px-6 lg:px-10">
          <Typography
            variant="caption"
            className="text-center text-muted-foreground lg:text-left"
          >
            © {new Date().getFullYear()} Ahia. Protected by escrow on every
            transaction.
          </Typography>
        </footer>
      </div>
    </div>
  );
}
