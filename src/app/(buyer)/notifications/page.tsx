import { EmptyNotificationsIllustration } from "@/components/illustrations";
import { Typography } from "@/components/Typography";
import { getNotifications } from "@/lib/services/notifications";
import { NotificationItem } from "./_components/NotificationItem";

export const metadata = { title: "Notifications — Ahia" };

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <Typography variant="heading-h1">Notifications</Typography>
        {unreadCount > 0 && (
          <Typography variant="label-md" className="text-muted-foreground">
            {unreadCount} unread
          </Typography>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
          <EmptyNotificationsIllustration className="size-32 text-primary/40" />
          <Typography variant="heading-h4">All caught up</Typography>
          <Typography variant="body-sm" className="max-w-xs text-muted-foreground">
            New payments, messages, and updates will show up here.
          </Typography>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
