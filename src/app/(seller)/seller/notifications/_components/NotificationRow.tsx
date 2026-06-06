"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
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
  type LucideIcon,
} from "lucide-react";

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

interface NotificationRowProps {
  notification: Notification;
}

const ICON: Record<NotificationType, LucideIcon> = {
  invoice_received: Wallet,
  invoice_paid: Wallet,
  invoice_received_payment: Wallet,
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

const ICON_TINT: Record<NotificationType, string> = {
  invoice_received: "bg-primary/10 text-primary",
  invoice_paid: "bg-primary/10 text-primary",
  invoice_received_payment: "bg-primary/10 text-primary",
  invoice_line_released: "bg-success/15 text-success",
  invoice_line_disputed: "bg-destructive/15 text-destructive",
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

/**
 * Backend's notification `link` field occasionally points at a route
 * that doesn't exist on the frontend (e.g. `follow` notifications link
 * to `/seller/shop/followers` but our actual route is
 * `/seller/followers`). Normalize them here in one place — easier than
 * chasing backend through every drift.
 */
function normalizeLink(notification: Notification): string | null {
  if (notification.type === "follow") return "/seller/followers";
  return notification.link ?? null;
}

export function NotificationRow({ notification }: NotificationRowProps) {
  const Icon = ICON[notification.type];
  const tint = ICON_TINT[notification.type];
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

  const inner = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3 transition-colors",
        notification.read
          ? "border-border bg-card hover:bg-muted/40"
          : "border-primary/30 bg-primary/3 hover:bg-primary/6"
      )}
    >
      <span
        aria-hidden
        className={cn("grid size-10 shrink-0 place-items-center rounded-lg", tint)}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <Typography
            variant="label-md"
            className={cn(!notification.read && "font-semibold")}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            className="shrink-0 text-muted-foreground"
          >
            {formatRelativeTime(notification.createdAt)}
          </Typography>
        </div>
        {body && (
          <Typography variant="body-sm" className="text-muted-foreground">
            {body}
          </Typography>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {!notification.read && (
          <span
            aria-label="Unread"
            className="size-2 shrink-0 rounded-full bg-primary"
          />
        )}
        <button
          type="button"
          onClick={handleArchive}
          aria-label="Dismiss notification"
          title="Dismiss"
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-60 transition-all hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );

  const href = normalizeLink(notification);
  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  // Outer <li> is provided by the list (NotificationsListClient). Returning
  // <li> here would nest <li> inside <li> — invalid HTML, hydration error.
  return inner;
}
