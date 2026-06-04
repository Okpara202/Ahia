"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, Send, X } from "lucide-react";

import { Typography } from "@/components/Typography";
import { startConversation } from "@/lib/actions/conversations";
import { formatRelativeTime } from "@/lib/format";
import { sendTextMessage } from "@/lib/services/conversations";
import { recordStoryView } from "@/lib/services/stories";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/utils";
import type { Story } from "@/types";

const STORY_DURATION_MS = 6000;

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  shopName: string;
  /** When provided, render the "reply to story" input at the bottom.
   *  Omitted for guest viewers (login-gated chat). */
  sellerId?: string;
  onClose: () => void;
}

export function StoryViewer({
  stories,
  initialIndex,
  shopName,
  sellerId,
  onClose,
}: StoryViewerProps) {
  const router = useRouter();
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const user = useAuthStore((s) => s.user);

  const story = stories[index];

  // Dedupe view beacons across the lifetime of this viewer mount. Each
  // story id fires once even if the user navigates back and forth.
  const viewedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!story?.id) return;
    if (viewedRef.current.has(story.id)) return;
    viewedRef.current.add(story.id);
    recordStoryView(story.id);
  }, [story?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(0);
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.min(1, elapsed / STORY_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) {
        window.clearInterval(id);
        if (index < stories.length - 1) {
          setIndex(index + 1);
        } else {
          onClose();
        }
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [index, stories.length, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, stories.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [stories.length, onClose]);

  async function handleReply() {
    if (!sellerId || !reply.trim() || sending || !story) return;
    if (!user) {
      router.push(`/login?next=/shops/${story.shopId}`);
      return;
    }
    setSending(true);
    try {
      const { conversationId } = await startConversation({ sellerId });
      await sendTextMessage(conversationId, reply.trim(), {
        storyId: story.id,
      });
      setReply("");
      toast.success("Reply sent", "Continuing in your inbox.");
      onClose();
      router.push(`/inbox/${conversationId}`);
    } catch (err) {
      toast.fromApiError("Couldn't send", err);
      setSending(false);
    }
  }

  if (!story || !story.media) return null;
  const isVideo = story.media.type === "video";
  const canReply = Boolean(sellerId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-in fade-in duration-200">
      <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
        {stories.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
          >
            <div
              className={cn(
                "h-full bg-white transition-[width]",
                i < index && "w-full",
                i === index && "duration-100",
                i > index && "w-0"
              )}
              style={{
                width: i === index ? `${progress * 100}%` : undefined,
              }}
            />
          </div>
        ))}
      </div>

      <header className="absolute inset-x-4 top-8 z-10 flex items-center justify-between gap-3 pt-3 text-white">
        <div className="flex flex-col">
          <Typography variant="label-lg">{shopName}</Typography>
          <Typography variant="caption" className="text-white/70">
            {formatRelativeTime(story.createdAt)}
          </Typography>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close stories"
          className="grid size-9 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors hover:bg-white/25"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="relative flex-1">
        {isVideo ? (
          <video
            key={story.id}
            src={story.media.url}
            poster={story.media.type === "video" ? story.media.poster : undefined}
            autoPlay
            muted
            playsInline
            loop
            className="absolute inset-0 h-full w-full object-contain animate-in fade-in duration-300"
          />
        ) : (
          <Image
            key={story.id}
            src={story.media.url}
            alt={story.caption ?? "Story"}
            fill
            sizes="100vw"
            className="object-contain animate-in fade-in duration-300"
            priority
          />
        )}

        <button
          type="button"
          aria-label="Previous story"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="absolute inset-y-0 left-0 w-1/3"
        />
        <button
          type="button"
          aria-label="Next story"
          onClick={() =>
            index < stories.length - 1 ? setIndex(index + 1) : onClose()
          }
          className="absolute inset-y-0 right-0 w-1/3"
        />

        {index > 0 && (
          <button
            type="button"
            aria-label="Previous"
            onClick={() => setIndex(index - 1)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur hover:bg-white/25 md:block"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        {index < stories.length - 1 && (
          <button
            type="button"
            aria-label="Next"
            onClick={() => setIndex(index + 1)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2 text-white backdrop-blur hover:bg-white/25 md:block"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-3 bg-linear-to-t from-black/90 to-transparent px-4 pb-8 pt-12 text-white">
        {story.caption && (
          <Typography variant="body-md" className="max-w-2xl">
            {story.caption}
          </Typography>
        )}
        {canReply && (
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleReply();
                }
              }}
              placeholder={`Reply to ${shopName}…`}
              aria-label="Reply to story"
              maxLength={500}
              disabled={sending}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/60 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleReply}
              disabled={!reply.trim() || sending}
              aria-label="Send reply"
              className="grid size-8 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 disabled:opacity-40"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>
        )}
        {story.productId && (
          <Link
            href={`/products/${story.productId}`}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 text-accent-foreground"
          >
            <Typography variant="label-md">View product</Typography>
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
