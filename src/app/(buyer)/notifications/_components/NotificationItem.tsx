import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Gift,
  Megaphone,
  ShieldCheck,
  Store,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

const ICON_MAP: Record<NotificationType, LucideIcon> = {
  invoice_received: CircleDollarSign,
  invoice_paid: CircleDollarSign,
  invoice_received_payment: CircleDollarSign,
  invoice_line_released: CheckCircle2,
  invoice_line_disputed: AlertTriangle,
  dispute_resolved: ShieldCheck,
  boost_purchased: Zap,
  discover_campaign_started: Megaphone,
  referral_completed: Gift,
  shop_reopened: Store,
};

const TINT_MAP: Record<NotificationType, string> = {
  invoice_received: "bg-primary/10 text-primary",
  invoice_paid: "bg-primary/10 text-primary",
  invoice_received_payment: "bg-primary/10 text-primary",
  invoice_line_released: "bg-success/15 text-success",
  invoice_line_disputed: "bg-destructive/10 text-destructive",
  dispute_resolved: "bg-primary/10 text-primary",
  boost_purchased: "bg-accent/15 text-accent",
  discover_campaign_started: "bg-accent/15 text-accent",
  referral_completed: "bg-success/15 text-success",
  shop_reopened: "bg-primary/10 text-primary",
};

export function NotificationItem({
  notification,
}: {
  notification: Notification;
}) {
  const Icon = ICON_MAP[notification.type];
  const tint = TINT_MAP[notification.type];

  const content = (
    <div
      className={cn(
        "flex items-start gap-4 rounded-2xl border p-4 transition-colors",
        notification.read
          ? "border-border bg-card hover:bg-muted/30"
          : "border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.06]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          tint
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <Typography variant="label-lg" className="truncate">
            {notification.title}
          </Typography>
          {!notification.read && (
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full bg-primary"
            />
          )}
        </div>
        <Typography variant="body-sm" className="text-muted-foreground">
          {notification.body}
        </Typography>
        <Typography
          variant="caption"
          className="mt-1 text-muted-foreground"
        >
          {formatRelativeTime(notification.createdAt)}
        </Typography>
      </div>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }
  return content;
}
