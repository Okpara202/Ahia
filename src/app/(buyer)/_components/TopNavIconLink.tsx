"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TopNavIconLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  className?: string;
  badge?: number;
  /** When true, render a green unread dot instead of a numeric count.
   *  Use for inbox / notifications. */
  unread?: boolean;
}

export function TopNavIconLink({
  href,
  label,
  icon: Icon,
  className,
  badge,
  unread,
}: TopNavIconLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const hasBadge = badge !== undefined && badge > 0;
  const showDot = !!unread && hasBadge;
  const showCount = !unread && hasBadge;
  const tooltipLabel = showDot
    ? `${label} (unread)`
    : showCount
      ? `${label} (${badge})`
      : label;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          aria-label={tooltipLabel}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative grid size-9 place-items-center rounded-md transition-colors",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            className,
          )}
        >
          <Icon className={cn("size-4", active && "stroke-[2.25]")} />
          {showCount && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-foreground"
            >
              {badge > 9 ? "9+" : badge}
            </span>
          )}
          {showDot && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-success"
            />
          )}
          {active && (
            <span
              aria-hidden
              className="absolute inset-x-2 bottom-[-7px] h-0.5 rounded-full bg-primary"
            />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}
