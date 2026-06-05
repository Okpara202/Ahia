"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Loader2, Sparkles, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Typography } from "@/components/Typography";
import { UploadOverlay } from "@/components/UploadOverlay";
import { compressImageIfNeeded, formatBytes } from "@/lib/image";
import { createStory } from "@/lib/services/stories";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

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
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | undefined>(
    undefined
  );
  const [optimizing, setOptimizing] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Release any blob URL we hold when the sheet unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    const video = picked.type.startsWith("video/");

    if (video) {
      if (picked.size > MAX_VIDEO_BYTES) {
        toast.error(
          "Video is too large",
          `${formatBytes(picked.size)} — please trim it to under ${formatBytes(
            MAX_VIDEO_BYTES
          )} and try again.`
        );
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(picked);
      setIsVideo(true);
      setPreviewUrl(URL.createObjectURL(picked));
      return;
    }

    setOptimizing(true);
    try {
      const result = await compressImageIfNeeded(picked);
      if (result.file.size > MAX_IMAGE_BYTES) {
        toast.error(
          "Photo is too large",
          `Even after optimizing, ${formatBytes(
            result.file.size
          )} is over the limit.`
        );
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(result.file);
      setIsVideo(false);
      setPreviewUrl(URL.createObjectURL(result.file));
    } catch (err) {
      console.warn("[story-compress] failed", err);
      toast.error(
        "Couldn't read that file",
        "Try a different photo or use JPEG/PNG."
      );
    } finally {
      setOptimizing(false);
    }
  }

  async function handlePost() {
    if (!file) return;
    setSubmitting(true);
    setUploadPercent(0);
    try {
      await createStory({
        file,
        isVideo,
        caption: caption.trim() || undefined,
        onProgress: setUploadPercent,
      });
      setUploadPercent(undefined);
      setPosted(true);
      toast.success("Story posted", "It expires in 24 hours.");
      router.refresh();
    } catch (err) {
      toast.fromApiError("Couldn't post", err);
      setSubmitting(false);
      setUploadPercent(undefined);
    }
  }

  const canPost = file !== null && !submitting && !optimizing;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <UploadOverlay
        open={submitting}
        progress={uploadPercent}
        title={isVideo ? "Uploading your video…" : "Posting your story…"}
        hint="Keep this tab open — we'll let you know when it's done."
      />
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
                "relative mx-auto aspect-4/5 w-44 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted sm:w-52",
                previewUrl && "border-solid border-primary"
              )}
            >
              {previewUrl ? (
                <>
                  {isVideo ? (
                    <video
                      src={previewUrl}
                      muted
                      playsInline
                      autoPlay
                      loop
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={previewUrl}
                      alt="Story preview"
                      fill
                      sizes="208px"
                      className="object-cover"
                      unoptimized
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={optimizing}
                    className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-foreground backdrop-blur transition-colors hover:bg-background disabled:opacity-50"
                  >
                    <Upload className="size-3.5" />
                    <Typography variant="label-sm">Replace</Typography>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={optimizing}
                  className="absolute inset-0 grid place-items-center gap-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {optimizing ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Upload className="size-5" />
                  )}
                  <Typography variant="label-sm">
                    {optimizing ? "Optimizing…" : "Photo or video"}
                  </Typography>
                </button>
              )}
            </div>
            {file && (
              <Typography
                variant="caption"
                className="text-center text-muted-foreground"
              >
                {formatBytes(file.size)} · {isVideo ? "video" : "photo"}
              </Typography>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFile}
            />

            <Input
              label="Caption"
              placeholder="What's new in the shop today?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={140}
              helperText="Optional. Stories live for 24 hours."
            />

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
