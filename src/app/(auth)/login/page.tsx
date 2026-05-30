import Link from "next/link";

import { Typography } from "@/components/Typography";
import { AuthCard } from "../_components/AuthCard";
import { AuthDivider } from "../_components/AuthDivider";
import { OAuthButtons } from "../_components/OAuthButtons";
import { LoginForm } from "./_components/LoginForm";

export const metadata = {
  title: "Sign in — Ahia",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to keep buying, selling, and chatting safely."
      footer={
        <Typography variant="body-sm" className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </Typography>
      }
    >
      <OAuthButtons context="login" />
      <AuthDivider />
      <LoginForm />
    </AuthCard>
  );
}
