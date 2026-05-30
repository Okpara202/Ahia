"use client";

import Link from "next/link";
import { Bell, Compass, Home, MessageCircle, Plus } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/Typography";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";
import { NavTab } from "./NavTab";

export function BuyerBottomNav() {
  const unreadChat = useChatStore((s) => s.unreadCount);
  const unreadNotifs = useNotificationStore((s) => s.unreadCount);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 h-16 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
    >
      <div className="grid h-full grid-cols-5 items-stretch">
        <NavTab href="/feed" icon={Home} label="Feed" />
        <NavTab href="/discover" icon={Compass} label="Discover" />
        <SellFab />
        <NavTab
          href="/inbox"
          icon={MessageCircle}
          label="Inbox"
          badge={unreadChat}
          authRequired
        />
        <NavTab
          href="/notifications"
          icon={Bell}
          label="Alerts"
          badge={unreadNotifs}
          authRequired
        />
      </div>
    </nav>
  );
}

function SellFab() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/seller"
            aria-label="Sell — open your shop"
            className="absolute -top-6 grid size-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-background transition-transform hover:scale-105"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top">Switch to selling</TooltipContent>
      </Tooltip>
      <Typography
        variant="caption"
        className="mt-7 text-muted-foreground"
      >
        Sell
      </Typography>
    </div>
  );
}
