import { Suspense } from "react";
import Link from "next/link";

import { Typography } from "@/components/Typography";
import { AuthCard } from "../_components/AuthCard";
import { AuthDivider } from "../_components/AuthDivider";
import { OAuthButtons } from "../_components/OAuthButtons";
import { SignupForm } from "./_components/SignupForm";

export const metadata = {
  title: "Create an account — Ahia",
};

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Free to join. Open a shop or start shopping in 60 seconds."
      footer={
        <Typography variant="body-sm" className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </Typography>
      }
    >
      {/* useSearchParams() inside OAuthButtons + SignupForm bails out of
          static prerender — Suspense restores it. See /login for the same
          pattern. */}
      <Suspense fallback={null}>
        <OAuthButtons context="signup" />
        <AuthDivider />
        <SignupForm />
      </Suspense>
    </AuthCard>
  );
}
