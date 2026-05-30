import Link from "next/link";

import { Typography } from "@/components/Typography";
import { AuthCard } from "../_components/AuthCard";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

export const metadata = {
  title: "Reset your password — Ahia",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter the email tied to your account and we'll send you a reset link."
      footer={
        <Typography variant="body-sm" className="text-muted-foreground">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </Typography>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
