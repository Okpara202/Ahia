"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  MessageCircle,
  Megaphone,
  Package,
  Settings,
  Sparkles,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When true and there's at least one unread item, render a green dot
   *  instead of a numeric count. Inbox / notifications use this so the
   *  signal is "there's something for you" rather than a noisy count. */
  unread?: boolean;
  unreadCount?: number;
}

interface SellerNavListProps {
  onNavigate?: () => void;
}

export function SellerNavList({ onNavigate }: SellerNavListProps) {
  const pathname = usePathname();
  const unreadConversations = useChatStore((s) => s.unreadCount);
  const unreadNotifications = useNotificationStore((s) => s.unreadCount);

  const items: NavItem[] = [
    { href: "/seller", label: "Dashboard", icon: LayoutDashboard },
    { href: "/seller/products", label: "Products", icon: Package },
    { href: "/seller/ads", label: "Ads", icon: Megaphone },
    { href: "/seller/stories", label: "Stories", icon: Sparkles },
    { href: "/seller/followers", label: "Followers", icon: Users },
    { href: "/seller/inbox", label: "Inbox", icon: MessageCircle, unread: true, unreadCount: unreadConversations },
    { href: "/seller/transactions", label: "Transactions", icon: Wallet },
    { href: "/seller/payouts", label: "Payouts", icon: Wallet },
    { href: "/seller/notifications", label: "Notifications", icon: Bell, unread: true, unreadCount: unreadNotifications },
    { href: "/seller/shop", label: "Shop settings", icon: Store },
    { href: "/seller/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Seller navigation">
      {items.map(({ href, label, icon: Icon, unread, unreadCount }) => {
        const active =
          href === "/seller"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
        const showDot = !!unread && (unreadCount ?? 0) > 0;

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={showDot ? `${label} (unread)` : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                active && "stroke-[2.25]"
              )}
            />
            <Typography
              variant="label-md"
              className={cn("flex-1", active && "font-semibold")}
            >
              {label}
            </Typography>
            {showDot && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full bg-success"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
