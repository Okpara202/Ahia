import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { Typography } from "@/components/Typography";

interface DisputeAlertProps {
  count: number;
}

export function DisputeAlert({ count }: DisputeAlertProps) {
  return (
    <Link
      href="/seller/transactions"
      className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 transition-colors hover:bg-destructive/15"
    >
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive text-destructive-foreground"
      >
        <AlertTriangle className="size-5" />
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <Typography variant="label-md" className="text-destructive">
          {count} open {count === 1 ? "dispute" : "disputes"} need attention
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Review the affected transactions and respond before the deadline.
        </Typography>
      </div>
      <ArrowRight className="size-4 text-destructive" />
    </Link>
  );
}
