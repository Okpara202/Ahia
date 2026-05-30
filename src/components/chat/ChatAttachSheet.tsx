"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";

import { Input } from "@/components/Input";
import { Portal } from "@/components/Portal";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { compressImageIfNeeded, formatBytes } from "@/lib/image";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";

/** Hard ceiling after compression. Matches backend's reject threshold so the
 *  user gets a friendly toast instead of a 5xx. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;
/** WhatsApp-style cap. Beyond this it's a small album, not a chat message. */
const MAX_IMAGES = 10;

type Mode = "image" | null;

interface PendingImage {
  /** Stable local id so React can track thumbnails when removed/reordered. */
  uid: string;
  file: File;
  previewUrl: string;
}

interface ChatAttachSheetProps {
  mode: Mode;
  onClose: () => void;
  onSendImage: (file: File, caption?: string) => void;
}

/**
 * Bottom-sheet for chat attachments. WhatsApp-style multi-pick: up to
 * MAX_IMAGES, each compressed via `compressImageIfNeeded` before they ever
 * touch the network. Caption applies to the first image only (convention
 * users already know from WhatsApp / Instagram DM).
 *
 * Layout caps at 85vh so the Send button is always visible on short
 * viewports — the thumbnail grid is the only scrolling region inside the
 * sheet.
 */
export function ChatAttachSheet({
  mode,
  onClose,
  onSendImage,
}: ChatAttachSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [caption, setCaption] = useState("");
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (mode === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImages((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        return [];
      });
      setCaption("");
      setOptimizing(false);
    }
  }, [mode]);

  // Revoke any blob URLs we still hold when this component fully unmounts.
  useEffect(() => {
    return () => {
      setImages((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        return [];
      });
    };
  }, []);

  useEffect(() => {
    if (mode === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mode]);

  if (mode === null) return null;

  function pickFiles() {
    if (optimizing) return;
    fileRef.current?.click();
  }

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(
        "That's the max",
        `Up to ${MAX_IMAGES} photos per message. Remove one to add another.`
      );
      return;
    }
    const accepted = picked.slice(0, room);
    if (accepted.length < picked.length) {
      toast.info(
        "Some photos skipped",
        `Only the first ${accepted.length} fit — ${MAX_IMAGES} is the per-message limit.`
      );
    }

    setOptimizing(true);
    let totalOriginal = 0;
    let totalOutput = 0;
    let compressedCount = 0;
    const added: PendingImage[] = [];

    try {
      for (const file of accepted) {
        try {
          const result = await compressImageIfNeeded(file);
          totalOriginal += result.originalBytes;
          totalOutput += result.outputBytes;
          if (result.compressed) compressedCount++;

          if (result.file.size > MAX_FILE_BYTES) {
            toast.error(
              "One photo was too large",
              `${file.name} is ${formatBytes(
                result.file.size
              )} after optimizing. Skipped.`
            );
            continue;
          }

          added.push({
            uid: `${Date.now()}_${Math.round(Math.random() * 1_000_000)}`,
            file: result.file,
            previewUrl: URL.createObjectURL(result.file),
          });
        } catch (err) {
          console.warn("[chat-image-compress] failed", err);
        }
      }

      if (added.length > 0) {
        setImages((prev) => [...prev, ...added]);
      }
      if (compressedCount > 0) {
        toast.success(
          compressedCount === 1
            ? "Optimized for faster upload"
            : `${compressedCount} photos optimized`,
          `${formatBytes(totalOriginal)} → ${formatBytes(totalOutput)}.`
        );
      }
    } finally {
      setOptimizing(false);
    }
  }

  function removeImage(uid: string) {
    setImages((prev) => {
      const target = prev.find((p) => p.uid === uid);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.uid !== uid);
    });
  }

  function handleSubmit() {
    if (images.length === 0) return;
    const trimmed = caption.trim();
    images.forEach((img, idx) => {
      // WhatsApp convention: caption rides on the first image only.
      onSendImage(img.file, idx === 0 ? trimmed || undefined : undefined);
    });
  }

  const canSend = images.length > 0 && !optimizing;
  const sendLabel =
    images.length === 0
      ? "Send"
      : images.length === 1
      ? "Send photo"
      : `Send ${images.length} photos`;

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:max-h-[80dvh]">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <ImagePlus className="size-4" />
            </span>
            <div className="flex flex-col">
              <Typography variant="heading-h3">Attach photos</Typography>
              <Typography
                variant="caption"
                className="text-muted-foreground"
              >
                {images.length === 0
                  ? `Up to ${MAX_IMAGES} per message`
                  : `${images.length} of ${MAX_IMAGES} selected`}
              </Typography>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Thumbnail area (scrolling region) */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {images.length === 0 && !optimizing ? (
            <EmptyPicker onClick={pickFiles} />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img) => (
                <Thumb key={img.uid} image={img} onRemove={removeImage} />
              ))}
              {optimizing && <ThumbSkeleton />}
              {!optimizing && images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={pickFiles}
                  aria-label="Add more photos"
                  className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <Plus className="size-6" />
                </button>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />

        {/* Caption + send (fixed footer) */}
        <div className="flex flex-col gap-3 border-t border-border bg-card px-5 py-4 sm:px-6">
          <Input
            placeholder={
              images.length > 1
                ? "Caption for the first photo (optional)"
                : "Caption (optional)"
            }
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <Button
            onClick={handleSubmit}
            variant="cta"
            size="lg"
            disabled={!canSend}
          >
            {sendLabel}
          </Button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

function EmptyPicker({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-6 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      <span className="grid size-12 place-items-center rounded-full bg-card text-primary">
        <ImagePlus className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <Typography variant="label-lg">Choose photos</Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Tap to pick — select multiple to send a set
        </Typography>
      </div>
    </button>
  );
}

interface ThumbProps {
  image: PendingImage;
  onRemove: (uid: string) => void;
}

function Thumb({ image, onRemove }: ThumbProps) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
      <Image
        src={image.previewUrl}
        alt="Pending photo"
        fill
        sizes="120px"
        className="object-cover"
        unoptimized
      />
      <button
        type="button"
        onClick={() => onRemove(image.uid)}
        aria-label="Remove photo"
        className={cn(
          "absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-all",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
          "hover:bg-destructive hover:text-destructive-foreground"
        )}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function ThumbSkeleton() {
  return (
    <div className="grid aspect-square place-items-center rounded-xl bg-muted/60 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}
