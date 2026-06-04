"use client";

import Link from "next/link";
import {
  Bell,
  Bookmark,
  Compass,
  MessageCircle,
  Search,
  UserRound,
} from "lucide-react";

import { Logo, LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { SearchBar } from "./SearchBar";
import { SwitchToSellerButton } from "./SwitchToSellerButton";
import { TopNavIconLink } from "./TopNavIconLink";

export function BuyerTopNav() {
  const unreadChat = useChatStore((s) => s.unreadCount);
  const unreadNotifs = useNotificationStore((s) => s.unreadCount);
  const savedCount = useWishlistStore((s) => s.ids.length);
  const isAuthed = useAuthStore((s) => s.isAuthed);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/feed" aria-label="Ahia home" className="flex items-center">
          <Logo variant="full" className="hidden sm:inline-flex" />
          <LogoMark className="size-8 sm:hidden" />
        </Link>

        <SearchBar />

        <div className="ml-auto flex items-center gap-1">
          {isAuthed && <SwitchToSellerButton />}

          <TopNavIconLink
            href="/search"
            label="Search"
            icon={Search}
            className="md:hidden"
          />
          <TopNavIconLink
            href="/discover"
            label="Discover"
            icon={Compass}
            className="hidden md:grid"
          />
          <TopNavIconLink
            href="/saved"
            label="Saved"
            icon={Bookmark}
            className="hidden md:grid"
            badge={savedCount}
          />

          {isAuthed && (
            <>
              <TopNavIconLink
                href="/inbox"
                label="Inbox"
                icon={MessageCircle}
                className="hidden md:grid"
                badge={unreadChat}
                unread
              />
              <TopNavIconLink
                href="/notifications"
                label="Notifications"
                icon={Bell}
                className="hidden md:grid"
                badge={unreadNotifs}
                unread
              />
            </>
          )}

          <ThemeToggle />

          {isAuthed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/profile"
                  aria-label="Profile"
                  className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <UserRound className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Profile</TooltipContent>
            </Tooltip>
          ) : (
            <div className="ml-1 flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild variant="cta" size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
