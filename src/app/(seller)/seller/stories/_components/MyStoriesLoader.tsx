"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, Loader2, Sparkles, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/PageLoader";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { deleteStory, getMyStories } from "@/lib/services/stories";
import { toast } from "@/store/toastStore";
import type { Story } from "@/types";

/**
 * Owner-only "Your stories" page. Shows every active (non-expired) story
 * with a thumbnail, time-left, view count, and a delete action.
 *
 * Empty state nudges the seller toward `PostStoryButton` on the dashboard
 * — we intentionally don't duplicate the composer here. One way in.
 */
export function MyStoriesLoader() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyStories()
      .then((s) => {
        if (cancelled) return;
        // Log what backend returned so empty-state debugging is possible
        // from the browser alone — no Render-log dive required.
        console.info("[my-stories] loaded", { count: s.length, stories: s });
        setStories(s);
      })
      .catch((err) => {
        if (cancelled) return;
        const apiErr = extractApiError(err);
        const status =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        console.warn("[my-stories] fetch failed", { status, apiErr });
        setStories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(storyId: string) {
    if (deletingId) return;
    setDeletingId(storyId);
    try {
      await deleteStory(storyId);
      setStories((prev) => (prev ? prev.filter((s) => s.id !== storyId) : prev));
      toast.success("Story removed", "Buyers will no longer see this one.");
    } catch (err) {
      toast.fromApiError("Couldn't delete", err);
    } finally {
      setDeletingId(null);
    }
  }

  if (stories === null) {
    return <PageLoader fullScreen={false} label="Loading your stories…" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-1">
        <Typography variant="overline" className="text-primary">
          Last 24 hours
        </Typography>
        <Typography variant="heading-h1">Your stories</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          Stories live for 24 hours, then disappear. Post new ones from
          your dashboard.
        </Typography>
      </header>

      {stories.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {stories.map((story) => (
            <li key={story.id}>
              <StoryCard
                story={story}
                onDelete={() => handleDelete(story.id)}
                deleting={deletingId === story.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface StoryCardProps {
  story: Story;
  onDelete: () => void;
  deleting: boolean;
}

function StoryCard({ story, onDelete, deleting }: StoryCardProps) {
  const [now] = useState(() => Date.now());
  if (!story.media) return null;
  const thumb =
    story.media.type === "image" ? story.media.url : story.media.poster;
  const hoursAgo = Math.floor(
    (now - new Date(story.createdAt).getTime()) / 3_600_000
  );
  const hoursLeft = Math.max(0, 24 - hoursAgo);

  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
      <span className="relative aspect-4/5 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {thumb ? (
          <Image
            src={thumb}
            alt={story.caption ?? "Story"}
            fill
            sizes="80px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="grid h-full place-items-center text-muted-foreground">
            <Sparkles className="size-5" />
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Typography variant="label-md" className="line-clamp-2">
          {story.caption || "Untitled story"}
        </Typography>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            <Typography variant="caption">
              {story.viewCount ?? 0}{" "}
              {(story.viewCount ?? 0) === 1 ? "view" : "views"}
            </Typography>
          </span>
          <Typography variant="caption">
            {hoursLeft === 0 ? "expired" : `${hoursLeft}h left`}
          </Typography>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deleting}
              className="w-fit gap-1.5 text-muted-foreground hover:text-destructive"
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              <Typography variant="caption">
                {deleting ? "Removing…" : "Remove"}
              </Typography>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this story?</AlertDialogTitle>
              <AlertDialogDescription>
                It&apos;ll disappear from your storefront immediately. Any
                chats started about it stay — buyers will still see the
                preview block above their reply.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Sparkles className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <Typography variant="heading-h3">No active stories</Typography>
        <Typography
          variant="body-sm"
          className="max-w-xs text-muted-foreground"
        >
          Post a story from your dashboard. It&apos;ll show up here for
          24 hours.
        </Typography>
      </div>
    </div>
  );
}
