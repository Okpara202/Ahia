"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Clock, Loader2, Sparkles, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { createStory } from "@/lib/services/stories";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";

export function PostStoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-4" />
        Post story
      </Button>
      {open && <StoryComposerSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function StoryComposerSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    e.target.value = "";
  }

  async function handlePost() {
    if (!file) return;
    setSubmitting(true);
    try {
      await createStory({ file, caption: caption.trim() || undefined });
      setPosted(true);
      toast.success("Story posted", "It expires in 24 hours.");
      router.refresh();
    } catch (err) {
      toast.error(
        "Couldn't post",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
      setSubmitting(false);
    }
  }

  const canPost = file !== null && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative flex w-full max-w-md flex-col gap-5 rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-300 sm:rounded-3xl sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </span>
            <Typography variant="heading-h3">Post a story</Typography>
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

        {posted ? (
          <PostedBody onClose={onClose} />
        ) : (
          <>
            <div
              className={cn(
                "relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted",
                previewUrl && "border-solid border-primary"
              )}
            >
              {previewUrl ? (
                <>
                  <Image
                    src={previewUrl}
                    alt="Story preview"
                    fill
                    sizes="400px"
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-foreground backdrop-blur transition-colors hover:bg-background"
                  >
                    <Upload className="size-3.5" />
                    <Typography variant="label-sm">Replace</Typography>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 grid place-items-center gap-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <Upload className="size-6" />
                  <Typography variant="label-md">Choose a photo</Typography>
                  <Typography variant="caption">
                    Portrait (4:5) recommended
                  </Typography>
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
              label="Caption"
              placeholder="What's new in the shop today?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={140}
              helperText="Optional. Keep it short — stories live for 24 hours."
            />

            <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-muted-foreground">
              <Clock className="size-4 shrink-0" />
              <Typography variant="caption">
                Stories auto-expire 24 hours after posting.
              </Typography>
            </div>

            <Button
              type="button"
              variant="cta"
              size="lg"
              onClick={handlePost}
              disabled={!canPost}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Posting…" : "Post story"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function PostedBody({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="flex flex-col items-center gap-3 py-3 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-6" strokeWidth={3} />
        </span>
        <Typography variant="heading-h3">Story live</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Buyers visiting your shop will see it at the top.
        </Typography>
      </div>
      <Button onClick={onClose} variant="cta" size="lg">
        Done
      </Button>
    </>
  );
}
