import { EmptyNotificationsIllustration } from "@/components/illustrations";
import { Typography } from "@/components/Typography";
import { getNotifications } from "@/lib/services/notifications";
import { NotificationRow } from "./_components/NotificationRow";

export const metadata = { title: "Notifications — Ahia Seller" };

export default async function SellerNotificationsPage() {
  const notifications = await getNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <Typography variant="heading-h1">Notifications</Typography>
        {unread > 0 && (
          <Typography variant="label-md" className="text-primary">
            {unread} unread
          </Typography>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
          <EmptyNotificationsIllustration className="size-32 text-primary/40" />
          <Typography variant="heading-h4">All caught up</Typography>
          <Typography variant="body-sm" className="max-w-xs text-muted-foreground">
            Payments, messages, and dispute updates will show up here.
          </Typography>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </ul>
      )}
    </div>
  );
}
