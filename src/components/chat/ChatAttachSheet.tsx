"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImagePlus, Upload, X } from "lucide-react";

import { Input } from "@/components/Input";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";

type Mode = "image" | null;

interface ChatAttachSheetProps {
  mode: Mode;
  onClose: () => void;
  onSendImage: (file: File, caption?: string) => void;
}

/**
 * Bottom-sheet for chat attachments. Chat v1 keeps this as image-only —
 * offers were retired in favor of invoices (composed via a different
 * sheet, see InvoiceComposer in Phase 2). Voice notes get their own
 * record-and-send button inline in ChatInput.
 */
export function ChatAttachSheet({
  mode,
  onClose,
  onSendImage,
}: ChatAttachSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (mode === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFile(null);
      setPreviewUrl("");
      setCaption("");
    }
  }, [mode]);

  useEffect(() => {
    if (mode === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mode]);

  if (mode === null) return null;

  function pickFile() {
    fileRef.current?.click();
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    e.target.value = "";
  }

  function handleSubmit() {
    if (file) onSendImage(file, caption.trim() || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative flex w-full max-w-md flex-col gap-4 rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-300 sm:rounded-3xl sm:p-6 sm:slide-in-from-bottom-4 sm:fade-in">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <ImagePlus className="size-4" />
            </span>
            <Typography variant="heading-h3">Attach image</Typography>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted">
          {previewUrl ? (
            <>
              <Image
                src={previewUrl}
                alt="Image preview"
                fill
                sizes="400px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={pickFile}
                className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-foreground backdrop-blur transition-colors hover:bg-background"
              >
                <Upload className="size-3.5" />
                <Typography variant="label-sm">Replace</Typography>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={pickFile}
              className="absolute inset-0 grid place-items-center gap-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Upload className="size-6" />
              <Typography variant="label-md">Choose a photo</Typography>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <Input
          label="Caption (optional)"
          placeholder="A close-up of the stitching…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <Button onClick={handleSubmit} variant="cta" size="lg" disabled={!file}>
          Send
        </Button>
      </div>
    </div>
  );
}
