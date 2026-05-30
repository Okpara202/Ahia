import { ArrowDownRight, ArrowUpRight, Flame, Sparkles } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import type { SellerDashboardStats } from "@/lib/services/seller";
import { cn } from "@/lib/utils";

interface EarningsMomentumProps {
  stats: SellerDashboardStats;
}

export function EarningsMomentum({ stats }: EarningsMomentumProps) {
  const { thisWeekEarned, lastWeekEarned, thisWeekSales } = stats;

  // First-week / cold-start case — no momentum to show yet.
  if (lastWeekEarned === 0 && thisWeekEarned === 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-5">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
        >
          <Sparkles className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <Typography variant="label-md">No earnings this week yet</Typography>
          <Typography variant="caption" className="text-muted-foreground">
            Drop a fresh listing or boost an existing one to land in front of
            new buyers.
          </Typography>
        </div>
      </div>
    );
  }

  const delta = thisWeekEarned - lastWeekEarned;
  const up = delta >= 0;
  const pct =
    lastWeekEarned > 0
      ? Math.round((delta / lastWeekEarned) * 100)
      : null;

  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const accentBg = up ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive";

  const headline = up
    ? thisWeekSales > 0
      ? `${thisWeekSales} sale${thisWeekSales === 1 ? "" : "s"} this week — keep the momentum going.`
      : "Earnings up — list one more product to ride the wave."
    : "Slower week. A boost or a fresh story usually flips it.";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={cn("grid size-10 shrink-0 place-items-center rounded-full", accentBg)}
        >
          <Flame className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <Typography variant="caption" className="text-muted-foreground">
            This week
          </Typography>
          <div className="flex items-baseline gap-2">
            <Typography variant="heading-h2">{formatNaira(thisWeekEarned)}</Typography>
            <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5", accentBg)}>
              <Icon className="size-3" />
              <Typography variant="caption" className="font-semibold">
                {pct !== null ? `${Math.abs(pct)}%` : "new"}
              </Typography>
            </span>
          </div>
          <Typography variant="caption" className="text-muted-foreground">
            {headline}
          </Typography>
        </div>
      </div>

      <div className="flex items-center gap-6 border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
        <div className="flex flex-col">
          <Typography variant="caption" className="text-muted-foreground">
            Last week
          </Typography>
          <Typography variant="label-md">{formatNaira(lastWeekEarned)}</Typography>
        </div>
      </div>
    </div>
  );
}
