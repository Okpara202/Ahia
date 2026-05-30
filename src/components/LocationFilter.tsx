"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";

import { Typography } from "@/components/Typography";
import {
  ALL_LOCATIONS,
  getLocations,
  type LocationFilter as LocationValue,
} from "@/lib/services/products";
import { cn } from "@/lib/utils";

interface LocationFilterProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  className?: string;
}

export function LocationFilter({
  value,
  onChange,
  className,
}: LocationFilterProps) {
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // One fetch per component mount. Backend filters by seller-active shops,
  // so cities with no active sellers don't appear at all.
  useEffect(() => {
    let cancelled = false;
    getLocations()
      .then((list) => {
        if (!cancelled) setLocations(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const active = value !== ALL_LOCATIONS;
  // ALL_LOCATIONS is a client-only sentinel; prepend it to whatever the
  // backend returned.
  const options = [ALL_LOCATIONS, ...locations];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 transition-colors",
          active
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-foreground hover:bg-muted"
        )}
      >
        <MapPin className="size-3.5" />
        <Typography variant="label-sm">{value}</Typography>
        <ChevronDown className="size-3.5 opacity-70" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-30 mt-2 flex w-48 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          {options.map((loc) => {
            const selected = loc === value;
            return (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(loc);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-muted",
                  selected && "bg-primary/4"
                )}
              >
                <Typography
                  variant="label-sm"
                  className={cn(selected && "font-semibold text-primary")}
                >
                  {loc}
                </Typography>
                {selected && (
                  <Check className="size-3.5 text-primary" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
