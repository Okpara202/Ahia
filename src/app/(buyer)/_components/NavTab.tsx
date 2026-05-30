"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn } from "@/lib/utils";

interface NavTabProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  /** When true, guest clicks redirect to /signup?next=... instead of navigating. */
  authRequired?: boolean;
}

export function NavTab({
  href,
  icon: Icon,
  label,
  badge,
  authRequired,
}: NavTabProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const requireAuth = useRequireAuth();

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        if (authRequired && !requireAuth(`to open ${label.toLowerCase()}`)) {
          e.preventDefault();
        }
      }}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="relative">
        <Icon className={cn("size-5", active && "stroke-[2.25]")} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1.5 -top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-foreground">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <Typography
        variant="caption"
        className={cn(active && "font-semibold")}
      >
        {label}
      </Typography>
    </Link>
  );
}
