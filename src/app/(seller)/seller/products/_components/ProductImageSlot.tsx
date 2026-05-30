"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ArrowUp, Link2, Loader2, Upload, X } from "lucide-react";

import { Input } from "@/components/Input";
import { Typography } from "@/components/Typography";
import { compressImageIfNeeded, formatBytes } from "@/lib/image";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import type { ProductImageItem } from "./ProductImagesField";

/** Hard ceiling. Files this large after compression are rejected. Matches
 *  backend's reject threshold so the user gets a friendly toast instead of a
 *  generic 500. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface ProductImageSlotProps {
  item: ProductImageItem | null;
  onChange: (next: ProductImageItem | null) => void;
  onMakeCover: () => void;
  isCover: boolean;
}

function previewFor(item: ProductImageItem): string {
  return item.kind === "file" ? item.previewUrl : item.url;
}

export function ProductImageSlot({
  item,
  onChange,
  onMakeCover,
  isCover,
}: ProductImageSlotProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const hasImage = item !== null;

  function pickFile() {
    if (optimizing) return;
    fileRef.current?.click();
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setOptimizing(true);
    try {
      const result = await compressImageIfNeeded(file);

      // Edge case: even after compression the file overflows (multi-megapixel
      // shot where the fallback quality still didn't fit). Give the user a
      // clear toast — this should be very rare.
      if (result.file.size > MAX_FILE_BYTES) {
        toast.error(
          "Image is too large",
          `Even after optimizing, ${file.name} is ${formatBytes(
            result.file.size
          )}. Try a smaller photo.`
        );
        return;
      }

      if (result.compressed) {
        toast.success(
          "Optimized for faster upload",
          `${formatBytes(result.originalBytes)} → ${formatBytes(
            result.outputBytes
          )}. Looks the same, uploads quicker.`
        );
      }

      onChange({
        kind: "file",
        file: result.file,
        previewUrl: URL.createObjectURL(result.file),
      });
    } catch (err) {
      console.warn("[image-compress] failed", err);
      toast.error(
        "Couldn't read that image",
        "Try a different file or use JPEG/PNG."
      );
    } finally {
      setOptimizing(false);
    }
  }

  function handleUrlChange(value: string) {
    onChange(value ? { kind: "url", url: value } : null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-xl border-2 bg-muted",
          isCover ? "border-primary" : "border-border"
        )}
      >
        {hasImage ? (
          // Plain <img> intentional — pasted URLs come from arbitrary hosts
          // (the user can paste anything) and `next/image` requires every host
          // be allowlisted in next.config. The preview is local-only; the real
          // image goes through Cloudinary on backend upload.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewFor(item)}
            alt={isCover ? "Cover image" : "Gallery image"}
            className="absolute inset-0 size-full object-cover"
          />
        ) : optimizing ? (
          <div className="absolute inset-0 grid place-items-center gap-1 bg-muted text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <Typography variant="caption">Optimizing…</Typography>
          </div>
        ) : (
          <button
            type="button"
            onClick={pickFile}
            className="absolute inset-0 grid place-items-center gap-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <Upload className="size-5" />
            <Typography variant="caption">Choose photo</Typography>
          </button>
        )}
        {isCover && hasImage && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
            <Typography variant="label-sm">Cover</Typography>
          </span>
        )}
        {hasImage && (
          <div className="absolute right-1.5 top-1.5 flex gap-1">
            {!isCover && (
              <button
                type="button"
                onClick={onMakeCover}
                aria-label="Set as cover"
                title="Set as cover"
                className="grid size-7 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-background"
              >
                <ArrowUp className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={pickFile}
              aria-label="Replace image"
              title="Replace"
              className="grid size-7 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-background"
            >
              <Upload className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove image"
              title="Remove"
              className="grid size-7 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {!hasImage &&
        (showUrlInput ? (
          <Input
            type="url"
            placeholder="https://…"
            value=""
            onChange={(e) => handleUrlChange(e.target.value)}
            autoFocus
            className="h-8 text-xs"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="inline-flex items-center justify-center gap-1 self-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <Link2 className="size-3" />
            <Typography variant="caption">or paste a link</Typography>
          </button>
        ))}
    </div>
  );
}
