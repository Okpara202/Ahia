"use client";

import Image from "next/image";
import { Check } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductPickerProps {
  products: Product[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ProductPicker({
  products,
  selectedId,
  onSelect,
}: ProductPickerProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <Typography variant="body-sm" className="text-muted-foreground">
          You don&apos;t have any products yet. Add one first, then create the
          ad.
        </Typography>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const active = p.id === selectedId;
        const thumb =
          p.media.type === "image" ? p.media.url : p.media.poster ?? "";
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            aria-pressed={active}
            className={cn(
              "group flex flex-col overflow-hidden rounded-xl border-2 text-left transition-colors",
              active
                ? "border-primary bg-primary/[0.04]"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div className="relative aspect-square w-full bg-muted">
              {thumb && (
                <Image
                  src={thumb}
                  alt={p.name}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              )}
              {active && (
                <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 p-2">
              <Typography variant="label-sm" className="line-clamp-1">
                {p.name}
              </Typography>
              <Typography variant="caption" className="text-primary">
                {formatNaira(p.price)}
              </Typography>
            </div>
          </button>
        );
      })}
    </div>
  );
}
