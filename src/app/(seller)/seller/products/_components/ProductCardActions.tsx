"use client";

import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  Eye,
  Share2,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ProductCardActionsProps {
  productId: string;
  boosted: boolean;
  hidden: boolean;
  onBoost: () => void;
  onShare: () => void;
  onToggleHide: () => void;
  onDelete: () => void;
}

export function ProductCardActions({
  productId,
  boosted,
  hidden,
  onBoost,
  onShare,
  onToggleHide,
  onDelete,
}: ProductCardActionsProps) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-y-1 border-t border-border pt-2">
      <div className="flex items-center gap-1">
        {!boosted && (
          <IconAction
            icon={Zap}
            label="Boost"
            onClick={onBoost}
            tone="accent"
          />
        )}
        <IconAction
          icon={Eye}
          label="Preview as buyer"
          href={`/products/${productId}`}
          external
        />
        <IconAction
          icon={Share2}
          label="Share to WhatsApp"
          onClick={onShare}
        />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <IconAction
          icon={hidden ? ArchiveRestore : Archive}
          label={hidden ? "Show in feed" : "Hide from feed"}
          onClick={onToggleHide}
        />
        <IconAction
          icon={Trash2}
          label="Delete"
          onClick={onDelete}
          tone="destructive"
        />
      </div>
    </div>
  );
}

interface IconActionProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  tone?: "default" | "accent" | "destructive";
  className?: string;
}

function IconAction({
  icon: Icon,
  label,
  onClick,
  href,
  external,
  tone = "default",
  className,
}: IconActionProps) {
  const toneClasses =
    tone === "accent"
      ? "hover:bg-accent/15 hover:text-accent"
      : tone === "destructive"
        ? "hover:bg-destructive/10 hover:text-destructive"
        : "hover:bg-muted hover:text-foreground";
  const baseClasses = cn(
    "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors",
    toneClasses,
    className
  );

  const inner = <Icon className="size-3.5" />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link
            href={href}
            aria-label={label}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className={baseClasses}
          >
            {inner}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={baseClasses}
          >
            {inner}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
