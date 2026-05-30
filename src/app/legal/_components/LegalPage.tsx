import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Typography } from "@/components/Typography";

interface LegalPageProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <Typography variant="label-sm">Back to Ahia</Typography>
      </Link>

      <header className="flex flex-col gap-2">
        <Typography variant="heading-h1">{title}</Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Last updated {updatedAt}
        </Typography>
      </header>

      <article className="flex flex-col gap-6 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-muted-foreground [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-muted-foreground [&_li]:pl-4 [&_li]:relative [&_li]:before:content-['•'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-primary">
        {children}
      </article>

      <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        This is a draft summary, not legal advice. The final, binding version
        will be vetted by counsel before launch. Questions? Email{" "}
        <a
          href="mailto:hello@ahia.ng"
          className="font-medium text-primary hover:underline"
        >
          hello@ahia.ng
        </a>
        .
      </p>
    </div>
  );
}
