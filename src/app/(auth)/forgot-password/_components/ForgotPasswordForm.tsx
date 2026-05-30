import Link from "next/link";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";

export function ForgotPasswordForm() {
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-accent/15 text-accent">
        <Sparkles className="size-6" />
      </span>
      <Typography variant="heading-h4">Reset by email — coming soon</Typography>
      <Typography variant="body-sm" className="text-muted-foreground">
        We&apos;re finalising password-reset emails. While we wrap that up, you
        can sign in with Google, or email{" "}
        <a
          href="mailto:hello@ahia.ng"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <Mail className="size-3.5" />
          hello@ahia.ng
        </a>{" "}
        and we&apos;ll help you in.
      </Typography>
      <Button asChild variant="cta" size="lg" className="mt-2 w-full">
        <Link href="/login">
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </Button>
    </div>
  );
}
