import { CheckCircle2, MessageCircle, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import type { SellerDashboardStats } from "@/lib/services/seller";

interface DashboardStatsProps {
  stats: SellerDashboardStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards: StatCardProps[] = [
    {
      label: "Total earned",
      value: formatNaira(stats.totalEarned),
      hint: "after platform fees",
      icon: TrendingUp,
      tint: "primary",
    },
    {
      label: "Pending payout",
      value: formatNaira(stats.pendingPayout),
      hint: "held in escrow",
      icon: Wallet,
      tint: "warning",
    },
    {
      label: "Completed sales",
      value: stats.completedSales.toString(),
      hint: "all-time",
      icon: CheckCircle2,
      tint: "success",
    },
    {
      label: "Unread messages",
      value: stats.unreadConversations.toString(),
      hint: stats.unreadConversations === 1 ? "conversation" : "conversations",
      icon: MessageCircle,
      tint: "accent",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

type Tint = "primary" | "accent" | "success" | "warning";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tint: Tint;
}

const TINT_BG: Record<Tint, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
};

function StatCard({ label, value, hint, icon: Icon, tint }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <Typography variant="caption" className="text-muted-foreground">
          {label}
        </Typography>
        <span
          aria-hidden
          className={`grid size-8 place-items-center rounded-lg ${TINT_BG[tint]}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <Typography variant="heading-h2" className="text-foreground">
        {value}
      </Typography>
      <Typography variant="caption" className="text-muted-foreground">
        {hint}
      </Typography>
    </div>
  );
}
