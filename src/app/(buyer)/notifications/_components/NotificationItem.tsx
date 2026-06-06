"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Gift,
  Heart,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatRelativeTime } from "@/lib/format";
import {
  notificationBody,
  notificationTitle,
} from "@/lib/notifications";
import { archiveNotification } from "@/lib/services/notifications";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store/notificationStore";
import type { Notification, NotificationType } from "@/types";

const ICON_MAP: Record<NotificationType, LucideIcon> = {
  invoice_received: CircleDollarSign,
  invoice_paid: CircleDollarSign,
  invoice_received_payment: CircleDollarSign,
  invoice_line_released: CheckCircle2,
  invoice_line_disputed: AlertTriangle,
  invoice_line_extended: Clock,
  dispute_resolved: ShieldCheck,
  dispute_auto_resolved: Clock,
  boost_purchased: Zap,
  discover_campaign_started: Megaphone,
  referral_completed: Gift,
  shop_reopened: Store,
  story_posted: Sparkles,
  payout_awaiting_account: Wallet,
  follow: Heart,
};

const TINT_MAP: Record<NotificationType, string> = {
  invoice_received: "bg-primary/10 text-primary",
  invoice_paid: "bg-primary/10 text-primary",
  invoice_received_payment: "bg-primary/10 text-primary",
  invoice_line_released: "bg-success/15 text-success",
  invoice_line_disputed: "bg-destructive/10 text-destructive",
  invoice_line_extended: "bg-accent/15 text-accent",
  dispute_resolved: "bg-primary/10 text-primary",
  dispute_auto_resolved: "bg-muted text-muted-foreground",
  boost_purchased: "bg-accent/15 text-accent",
  discover_campaign_started: "bg-accent/15 text-accent",
  referral_completed: "bg-success/15 text-success",
  shop_reopened: "bg-primary/10 text-primary",
  story_posted: "bg-accent/15 text-accent",
  payout_awaiting_account: "bg-accent/15 text-accent",
  follow: "bg-primary/10 text-primary",
};

export function NotificationItem({
  notification,
}: {
  notification: Notification;
}) {
  const Icon = ICON_MAP[notification.type];
  const tint = TINT_MAP[notification.type];
  const title = notificationTitle(notification);
  const body = notificationBody(notification);

  function handleArchive(e: React.MouseEvent<HTMLButtonElement>) {
    // Stop the click bubbling to the wrapping <Link> so we don't navigate
    // when the user just wanted to dismiss the row.
    e.preventDefault();
    e.stopPropagation();
    useNotificationStore.getState().remove(notification.id);
    void archiveNotification(notification.id).catch(() => {
      // Best-effort. If backend fails, the row reappears on next list fetch.
    });
  }

  const content = (
    <div
      className={cn(
        "flex items-start gap-4 rounded-2xl border p-4 transition-colors",
        notification.read
          ? "border-border bg-card hover:bg-muted/30"
          : "border-primary/30 bg-primary/3 hover:bg-primary/6"
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
            {title}
          </Typography>
          {!notification.read && (
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full bg-primary"
            />
          )}
        </div>
        {body && (
          <Typography variant="body-sm" className="text-muted-foreground">
            {body}
          </Typography>
        )}
        <Typography
          variant="caption"
          className="mt-1 text-muted-foreground"
        >
          {formatRelativeTime(notification.createdAt)}
        </Typography>
      </div>
      <button
        type="button"
        onClick={handleArchive}
        aria-label="Dismiss notification"
        title="Dismiss"
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-60 transition-all hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }
  return content;
}
