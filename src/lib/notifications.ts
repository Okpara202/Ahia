import type { Notification, NotificationType } from "@/types";

/**
 * Fallback labels by notification type — used when backend hands back a
 * record with empty `title`/`body` (some notification types are created with
 * just the payload, no pre-rendered copy). Frontend renders something useful
 * instead of an empty row.
 */
const FALLBACK_LABELS: Record<
  NotificationType,
  { title: string; body: string }
> = {
  invoice_received: {
    title: "New invoice received",
    body: "Open the chat to review and pay.",
  },
  invoice_paid: {
    title: "Payment received",
    body: "Your money is now held in escrow until you confirm delivery.",
  },
  invoice_received_payment: {
    title: "Buyer paid you",
    body: "Funds are held in escrow. Released when the buyer confirms each line.",
  },
  invoice_line_released: {
    title: "Funds released",
    body: "An invoice line has been released to the seller.",
  },
  invoice_line_disputed: {
    title: "Line disputed",
    body: "A buyer opened a dispute on one of your invoice lines.",
  },
  invoice_line_extended: {
    title: "Buyer extended review window",
    body: "Funds will hold for another 7 days.",
  },
  dispute_resolved: {
    title: "Dispute resolved",
    body: "An admin has decided on the dispute.",
  },
  boost_purchased: {
    title: "Boost active",
    body: "Your product is now boosted in the feed.",
  },
  discover_campaign_started: {
    title: "Ad campaign started",
    body: "Your Discover campaign is now live.",
  },
  referral_completed: {
    title: "Referral reward earned",
    body: "A friend you invited just completed their first sale.",
  },
  shop_reopened: {
    title: "Shop reopened",
    body: "A shop you follow is back online.",
  },
};

/** Pick the best title for a notification: backend-rendered if present,
 *  otherwise the type-derived fallback. */
export function notificationTitle(n: Notification): string {
  const t = n.title?.trim();
  if (t) return t;
  return FALLBACK_LABELS[n.type]?.title ?? "Update";
}

/** Same for body. */
export function notificationBody(n: Notification): string {
  const b = n.body?.trim();
  if (b) return b;
  return FALLBACK_LABELS[n.type]?.body ?? "";
}
