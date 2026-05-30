"use client";

import { useState, type DragEvent } from "react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import { ProductImageSlot } from "./ProductImageSlot";

/**
 * One product image — either a freshly-picked local file (pending upload) or a
 * URL the seller pasted / kept from a prior save. The form bundles `file`
 * entries as `image_files[]` and `url` entries as `image_urls[]` per
 * BACKEND_HANDOFF.md §3.
 */
export type ProductImageItem =
  | { kind: "file"; file: File; previewUrl: string }
  | { kind: "url"; url: string };

interface ProductImagesFieldProps {
  /** First entry is the cover (shown in feed); remaining are the gallery. */
  items: ProductImageItem[];
  onChange: (next: ProductImageItem[]) => void;
  /** Max total slots, including cover. Defaults to 6. */
  max?: number;
  /** Backend-supplied error scoped to the images field — e.g. from
   *  `apiErr.fields.image_files` on a `FILE_TOO_LARGE` reject. Rendered as
   *  red helper text below the grid. */
  error?: string;
}

export function ProductImagesField({
  items,
  onChange,
  max = 6,
  error,
}: ProductImagesFieldProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  function update(index: number, next: ProductImageItem | null) {
    // Index === items.length means the user just filled the trailing empty
    // slot — append rather than mutate a non-existent entry.
    if (index >= items.length) {
      if (next !== null) onChange([...items, next]);
      return;
    }
    if (next === null) {
      onChange(items.filter((_, i) => i !== index));
      return;
    }
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...items];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  function moveItem(from: number, to: number) {
    if (from === to || from < 0 || from >= items.length) return;
    const next = [...items];
    const [picked] = next.splice(from, 1);
    // Clamp `to` so dropping past the end appends without leaving a gap.
    const insertAt = Math.min(to, next.length);
    next.splice(insertAt, 0, picked);
    onChange(next);
  }

  function handleDragStart(i: number, e: DragEvent<HTMLDivElement>) {
    // Skip the trailing empty slot — there's nothing to drag.
    if (i >= items.length) {
      e.preventDefault();
      return;
    }
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers require setData to start the drag.
    e.dataTransfer.setData("text/plain", String(i));
  }

  function handleDragOver(i: number, e: DragEvent<HTMLDivElement>) {
    if (dragIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (i !== hoverIndex) setHoverIndex(i);
  }

  function handleDrop(i: number, e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (dragIndex === null) return;
    moveItem(dragIndex, i);
    setDragIndex(null);
    setHoverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setHoverIndex(null);
  }

  // Always render one trailing empty slot until max is reached, so the seller
  // never has to click "add another" — picking/pasting in the trailing slot
  // naturally appends and a new empty slot appears.
  const slots: (ProductImageItem | null)[] = [...items];
  if (items.length < max) slots.push(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <Typography variant="label-md">Product images</Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {items.length}/{max} • drag to reorder — first image is the cover
        </Typography>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {slots.map((slot, i) => {
          const isFilled = slot !== null;
          const isHovered = hoverIndex === i && dragIndex !== null && dragIndex !== i;
          const isDragging = dragIndex === i;
          return (
            <div
              key={i}
              draggable={isFilled}
              onDragStart={(e) => handleDragStart(i, e)}
              onDragOver={(e) => handleDragOver(i, e)}
              onDrop={(e) => handleDrop(i, e)}
              onDragEnd={handleDragEnd}
              className={cn(
                "transition-all",
                isFilled && "cursor-grab active:cursor-grabbing",
                isDragging && "opacity-40",
                isHovered && "scale-105 rounded-xl ring-2 ring-primary"
              )}
            >
              <ProductImageSlot
                item={slot}
                onChange={(next) => update(i, next)}
                onMakeCover={() => makeCover(i)}
                isCover={i === 0}
              />
            </div>
          );
        })}
      </div>

      {error && (
        <Typography variant="caption" className="text-destructive">
          {error}
        </Typography>
      )}

      <Typography variant="caption" className="text-muted-foreground">
        Upload from your gallery or paste an image link. Photos over 5 MB are
        automatically optimized for a smoother experience — same look, faster
        uploads, less data used. Drag any image to position 1 to make it the
        cover.
      </Typography>
    </div>
  );
}
