"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Heart, LogOut, Receipt, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/Typography";
import { apiClient } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

/**
 * Top-nav profile dropdown. Sits where the bare profile icon used to —
 * tapping it opens a menu of account destinations rather than navigating
 * straight to `/profile`. Surfaces `/following` (which previously was
 * only reachable from inside the profile page), plus transactions and
 * sign-out one click away.
 *
 * Items in here are deliberately distinct from the top-nav icon row
 * (Inbox / Notifications). Saved IS included here because its top-nav
 * icon is `hidden md:grid` — without this entry mobile buyers would have
 * no way to reach `/saved`.
 */
export function ProfileMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await apiClient().post("/auth/logout");
    } catch {
      // Backend already clears the cookie on 401 / network blip — local
      // sign-out below still lands the user as a guest.
    }
    disconnectSocket();
    useAuthStore.getState().signOut();
    toast.success("Signed out");
    router.push("/");
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="grid size-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <UserRound className="size-4" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Account</TooltipContent>
      </Tooltip>

      <DropdownMenuContent>
        {user && (
          <>
            <DropdownMenuLabel asChild>
              <div className="flex flex-col gap-0.5 px-3 py-2">
                <Typography variant="label-md" className="text-foreground">
                  {user.name}
                </Typography>
                <Typography
                  variant="caption"
                  className="truncate text-muted-foreground"
                >
                  {user.email}
                </Typography>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound className="size-4 text-muted-foreground" />
            <span className="flex-1">Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/saved">
            <Bookmark className="size-4 text-muted-foreground" />
            <span className="flex-1">Saved</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/following">
            <Heart className="size-4 text-muted-foreground" />
            <span className="flex-1">Shops you follow</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/transactions">
            <Receipt className="size-4 text-muted-foreground" />
            <span className="flex-1">Transactions</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void handleSignOut();
          }}
          disabled={signingOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          <span className="flex-1">{signingOut ? "Signing out…" : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
