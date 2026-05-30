"use client";

import { PreferencesSection } from "@/components/PreferencesSection";
import { Typography } from "@/components/Typography";
import { useAuthStore } from "@/store/authStore";
import { AccountDetailsForm } from "./AccountDetailsForm";
import { ReferralSection } from "./ReferralSection";
import { SignOutButton } from "./SignOutButton";

export function ProfileContent() {
  // AuthGate guarantees a non-null user before this renders.
  const user = useAuthStore((s) => s.user)!;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col gap-1">
        <Typography variant="heading-h1">Profile</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          Manage your account and sign-in.
        </Typography>
      </div>

      <section className="flex items-center gap-5 rounded-2xl border border-border bg-card p-5">
        <span
          aria-hidden
          className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
        >
          <Typography variant="heading-h2">{user.name.charAt(0)}</Typography>
        </span>
        <div className="flex flex-col">
          <Typography variant="heading-h3">{user.name}</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Joined{" "}
            {new Date(user.createdAt).toLocaleDateString("en-NG", {
              month: "long",
              year: "numeric",
            })}
          </Typography>
        </div>
      </section>

      <AccountDetailsForm user={user} />

      <ReferralSection
        code={user.name.split(" ")[0]?.toLowerCase() ?? user.id}
      />

      <PreferencesSection />

      <section className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/3 p-5">
        <Typography variant="heading-h4">Sign out</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          You&apos;ll be signed out on this device.
        </Typography>
        <div>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
