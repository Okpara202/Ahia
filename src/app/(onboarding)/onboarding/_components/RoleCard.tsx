"use client";

import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  body: string;
  selected: boolean;
  onSelect: () => void;
}

export function RoleCard({
  icon: Icon,
  title,
  body,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02]"
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl transition-colors",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary"
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <Typography variant="heading-h4">{title}</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          {body}
        </Typography>
      </div>
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border"
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}
