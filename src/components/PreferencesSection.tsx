"use client";

import { Info } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/store/preferencesStore";

export function PreferencesSection() {
  const tooltipsEnabled = usePreferencesStore((s) => s.tooltipsEnabled);
  const setTooltipsEnabled = usePreferencesStore((s) => s.setTooltipsEnabled);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <Typography variant="heading-h4">Preferences</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Tweak how Ahia behaves on this device.
        </Typography>
      </div>

      <ToggleRow
        title="Show tooltips"
        description="Hover hints over icon buttons across the app."
        icon={Info}
        checked={tooltipsEnabled}
        onCheckedChange={setTooltipsEnabled}
      />
    </section>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  icon: typeof Info;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}

function ToggleRow({
  title,
  description,
  icon: Icon,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-background p-4">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
      >
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography variant="label-md">{title}</Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {description}
        </Typography>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-5 rounded-full bg-background shadow-sm transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
