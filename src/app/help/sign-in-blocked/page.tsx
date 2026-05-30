import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Mail,
  ShieldOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";

export const metadata = {
  title: "Sign-in blocked — Ahia",
  description:
    "Your browser blocked the cookie from Google sign-in. Use email instead, or lower Brave Shields for this site.",
};

export default function SignInBlockedPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <Typography variant="label-sm">Back to Ahia</Typography>
      </Link>

      <header className="flex flex-col gap-3">
        <span
          aria-hidden
          className="grid size-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400"
        >
          <ShieldOff className="size-7" />
        </span>
        <Typography variant="heading-h1">
          Google sign-in was blocked
        </Typography>
        <Typography variant="body-lg" className="text-muted-foreground">
          Your browser&apos;s privacy shield dropped the sign-in cookie during
          the Google handshake. This mostly happens on Brave with default
          Shields. Email sign-in still works normally — that&apos;s the
          fastest fix.
        </Typography>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <Typography variant="heading-h3" className="flex items-center gap-2 text-primary">
          <Mail className="size-5" />
          Fastest fix — sign in with email
        </Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          Email sign-in uses a direct request, not a redirect through Google,
          so your browser doesn&apos;t flag it. If you already created your
          account with Google, use the same email and tap{" "}
          <span className="font-medium text-foreground">Forgot password?</span>{" "}
          to set a password.
        </Typography>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="cta" size="lg" className="flex-1">
            <Link href="/login">
              Sign in with email
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link href="/forgot-password">Reset my password</Link>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <Typography variant="heading-h3">
          Or lower Brave Shields for this site
        </Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          If you&apos;d rather keep using Google sign-in, you can disable the
          Shield that&apos;s blocking it. This affects only Ahia — other
          sites keep their full protection.
        </Typography>
        <ol className="flex flex-col gap-3">
          <Step
            n={1}
            title="Tap the Brave Shields icon"
            body="It's the lion in your address bar, next to the URL."
          />
          <Step
            n={2}
            title="Switch ‘Shields’ to DOWN for this site"
            body="The simplest reset. You can also leave Shields up and only toggle off ‘Cross-site cookies blocked’ and ‘Bounce tracking protection’ — Ahia needs both during Google sign-in."
          />
          <Step
            n={3}
            title="Try Google sign-in again"
            body="The page may reload — that's normal. Then head back to sign in."
          />
        </ol>
        <Typography variant="caption" className="text-muted-foreground">
          You can also open Ahia in{" "}
          <span className="font-medium text-foreground">Edge</span>,{" "}
          <span className="font-medium text-foreground">Chrome</span>, or{" "}
          <span className="font-medium text-foreground">Firefox</span> — none of
          them block the Google sign-in cookie by default.
        </Typography>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <Typography variant="heading-h3">
          If your session simply expired
        </Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          Sessions on Ahia last 7 days. If you signed in a while back and just
          got bounced here, that&apos;s probably the cause — just sign in
          again. No browser changes needed.
        </Typography>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <Typography variant="heading-h4" className="flex items-center gap-2">
          <Globe className="size-5 text-muted-foreground" />
          Why does this happen?
        </Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Our app and our servers currently live on different domains while
          we&apos;re in the prototype phase. Google sign-in works by bouncing
          you between us, Google, and back — and strict browsers like Brave
          treat that bounce pattern as a tracking attempt and drop the cookie.
          Once Ahia moves to its own domain, both halves will share the same
          root and the problem disappears for everyone — no Shield exceptions,
          no browser switching, full Google sign-in support everywhere.
        </Typography>
      </section>

      <Typography variant="caption" className="text-muted-foreground">
        Still stuck? Email{" "}
        <Link
          href="mailto:hello@ahia.ng"
          className="text-primary hover:underline"
        >
          hello@ahia.ng
        </Link>{" "}
        and we&apos;ll help directly.
      </Typography>
    </div>
  );
}

interface StepProps {
  n: number;
  title: string;
  body: string;
}

function Step({ n, title, body }: StepProps) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        <Typography variant="label-sm" className="font-bold">
          {n}
        </Typography>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography variant="label-lg">{title}</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          {body}
        </Typography>
      </div>
    </li>
  );
}
