import { Check, Minus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";

type Verdict = "yes" | "no" | "partial";

interface Row {
  label: string;
  whatsapp: Verdict;
  jiji: Verdict;
  ahia: Verdict;
  hint?: string;
}

const ROWS: Row[] = [
  {
    label: "Discover new shops",
    whatsapp: "no",
    jiji: "yes",
    ahia: "yes",
    hint: "Personalised feed + short-form video.",
  },
  {
    label: "Chat with the seller",
    whatsapp: "yes",
    jiji: "no",
    ahia: "yes",
  },
  {
    label: "Escrow on payments",
    whatsapp: "no",
    jiji: "no",
    ahia: "yes",
    hint: "Money sits with Ahia until delivery.",
  },
  {
    label: "Dispute resolution",
    whatsapp: "no",
    jiji: "partial",
    ahia: "yes",
  },
  {
    label: "Free to open a shop",
    whatsapp: "yes",
    jiji: "yes",
    ahia: "yes",
  },
  {
    label: "Built for Nigeria",
    whatsapp: "partial",
    jiji: "yes",
    ahia: "yes",
  },
];

const ICONS: Record<Verdict, LucideIcon> = {
  yes: Check,
  no: X,
  partial: Minus,
};

const VERDICT_TONE: Record<Verdict, string> = {
  yes: "bg-success/15 text-success",
  no: "bg-muted text-muted-foreground",
  partial: "bg-accent/15 text-accent",
};

export function Comparison() {
  return (
    <section>
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Typography variant="overline" className="text-primary">
            How Ahia compares
          </Typography>
          <Typography variant="heading-h2" className="mt-3">
            One marketplace, all three superpowers.
          </Typography>
          <Typography variant="body-md" className="mt-3 text-muted-foreground">
            WhatsApp is personal. Jiji is searchable. Neither protects your
            money. Ahia gives you all three.
          </Typography>
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-border bg-card">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-4 text-left">
                  <Typography variant="caption" className="text-muted-foreground">
                    Capability
                  </Typography>
                </th>
                <ColumnHeader label="WhatsApp" />
                <ColumnHeader label="Jiji" />
                <ColumnHeader label="Ahia" highlight />
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className={cn(i % 2 === 1 && "bg-muted/30")}
                >
                  <td className="px-4 py-4 align-top">
                    <Typography variant="label-md">{row.label}</Typography>
                    {row.hint && (
                      <Typography
                        variant="caption"
                        className="block text-muted-foreground"
                      >
                        {row.hint}
                      </Typography>
                    )}
                  </td>
                  <VerdictCell verdict={row.whatsapp} />
                  <VerdictCell verdict={row.jiji} />
                  <VerdictCell verdict={row.ahia} highlight />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ColumnHeader({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <th scope="col" className="px-4 py-4 text-center">
      <Typography
        variant="label-lg"
        className={cn(highlight && "text-primary font-bold")}
      >
        {label}
      </Typography>
    </th>
  );
}

function VerdictCell({ verdict, highlight }: { verdict: Verdict; highlight?: boolean }) {
  const Icon = ICONS[verdict];
  return (
    <td
      className={cn(
        "px-4 py-4 text-center",
        highlight && "bg-primary/[0.04]"
      )}
    >
      <span
        aria-label={
          verdict === "yes"
            ? "Yes"
            : verdict === "no"
              ? "No"
              : "Partial"
        }
        className={cn(
          "inline-grid size-7 place-items-center rounded-full",
          VERDICT_TONE[verdict]
        )}
      >
        <Icon className="size-3.5" />
      </span>
    </td>
  );
}
