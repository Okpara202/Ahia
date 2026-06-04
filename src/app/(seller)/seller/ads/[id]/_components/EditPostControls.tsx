"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/Textarea";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { compressImageIfNeeded, formatBytes } from "@/lib/image";
import { editDiscoverPost } from "@/lib/services/discover";
import { toast } from "@/store/toastStore";

const MAX_POSTER_BYTES = 5 * 1024 * 1024;

interface EditPostControlsProps {
  postId: string;
  caption: string;
  editsRemaining: number;
}

/**
 * Paid-tier edit controls on `/seller/ads/[id]`. Only renders for
 * sponsored posts (the page gates this). When `editsRemaining === 0`,
 * the controls render disabled with an explanation; we don't hide them
 * so the seller can see why they can't edit anymore.
 *
 * Two independent edit actions:
 *   - Save caption (text only)
 *   - Replace poster (image upload)
 *
 * Each counts as one edit toward the 3-lifetime cap.
 */
export function EditPostControls({
  postId,
  caption: initialCaption,
  editsRemaining,
}: EditPostControlsProps) {
  const router = useRouter();
  const posterInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState(initialCaption);
  const [savingCaption, setSavingCaption] = useState(false);
  const [savingPoster, setSavingPoster] = useState(false);

  const captionDirty = caption.trim() !== initialCaption.trim();
  const exhausted = editsRemaining <= 0;
  const busy = savingCaption || savingPoster;

  async function handleSaveCaption() {
    if (!captionDirty || exhausted || busy) return;
    setSavingCaption(true);
    try {
      await editDiscoverPost(postId, { caption: caption.trim() });
      toast.success(
        "Caption updated",
        `${editsRemaining - 1} edit${editsRemaining - 1 === 1 ? "" : "s"} left.`
      );
      router.refresh();
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr?.code === "edit_limit_reached") {
        toast.error(
          "No edits left",
          "Re-upload as a new post if you need further changes.",
          apiErr.requestId
        );
      } else if (apiErr?.code === "post_expired") {
        toast.error(
          "Post expired",
          "This post is past its 30-day window.",
          apiErr.requestId
        );
      } else {
        toast.fromApiError("Couldn't save caption", err);
      }
      setSavingCaption(false);
    }
  }

  async function handlePickPoster(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || exhausted || busy) return;
    setSavingPoster(true);
    try {
      const result = await compressImageIfNeeded(f);
      if (result.file.size > MAX_POSTER_BYTES) {
        toast.error(
          "Poster is too large",
          `Even after optimizing, ${formatBytes(
            result.file.size
          )} is over the ${formatBytes(MAX_POSTER_BYTES)} limit.`
        );
        setSavingPoster(false);
        return;
      }
      await editDiscoverPost(postId, { posterFile: result.file });
      toast.success(
        "Poster replaced",
        `${editsRemaining - 1} edit${editsRemaining - 1 === 1 ? "" : "s"} left.`
      );
      router.refresh();
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr?.code === "edit_limit_reached") {
        toast.error(
          "No edits left",
          "Re-upload as a new post if you need further changes.",
          apiErr.requestId
        );
      } else if (apiErr?.code === "post_expired") {
        toast.error(
          "Post expired",
          "This post is past its 30-day window.",
          apiErr.requestId
        );
      } else {
        toast.fromApiError("Couldn't replace poster", err);
      }
      setSavingPoster(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
        >
          <Pencil className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <Typography variant="heading-h4">Edit this post</Typography>
          <Typography variant="caption" className="text-muted-foreground">
            {exhausted
              ? "You've used all 3 edits on this post. Re-upload as a new one to keep iterating."
              : `${editsRemaining} of 3 edits left. Video and link target can't be changed.`}
          </Typography>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <Textarea
          label="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
          disabled={exhausted || busy}
          helperText={`${caption.length}/140`}
          error={
            caption.length > 140 ? "Keep it under 140 characters" : undefined
          }
        />
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveCaption}
            disabled={
              !captionDirty || exhausted || busy || caption.length > 140
            }
          >
            {savingCaption && <Loader2 className="size-3.5 animate-spin" />}
            {savingCaption ? "Saving…" : "Save caption"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => posterInputRef.current?.click()}
          disabled={exhausted || busy}
        >
          {savingPoster ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImageIcon className="size-3.5" />
          )}
          {savingPoster ? "Replacing…" : "Replace poster"}
        </Button>
        <Typography variant="caption" className="text-muted-foreground">
          JPEG or PNG, under {formatBytes(MAX_POSTER_BYTES)}.
        </Typography>
        <input
          ref={posterInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePickPoster}
        />
      </div>
    </section>
  );
}
