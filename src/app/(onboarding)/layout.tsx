import Link from "next/link";

import { BraveAuthWarning } from "@/components/BraveAuthWarning";
import { Logo } from "@/components/Logo";
import { StoreHydrator } from "@/components/StoreHydrator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser } from "@/lib/services/users";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Onboarding needs the user loaded so the role form can skip a redundant
  // PATCH when the user already has the role they picked (e.g. Google OAuth
  // creates new users with role=buyer by default; picking "buyer" should
  // just route without hitting the API).
  const user = await getCurrentUser();

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <StoreHydrator
        user={user}
        activeRole={user?.role ?? "buyer"}
        conversations={[]}
        notifications={[]}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[50vh] bg-[radial-gradient(ellipse_at_top,var(--color-primary)_0%,transparent_55%)] opacity-[0.06]"
      />

      <BraveAuthWarning />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Ahia home">
          <Logo variant="full" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
