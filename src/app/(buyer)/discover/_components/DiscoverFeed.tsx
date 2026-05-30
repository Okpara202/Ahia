"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";

import { Typography } from "@/components/Typography";
import { getDiscoverFeed } from "@/lib/services/discover";
import type { DiscoverFeedItem } from "@/types";
import { DiscoverItem } from "./DiscoverItem";

export function DiscoverFeed() {
  const [items, setItems] = useState<DiscoverFeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [muted, setMuted] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (cursorArg: string | null) => {
    const isFirst = cursorArg === null;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);

    const page = await getDiscoverFeed({ cursor: cursorArg });

    setItems((prev) => (isFirst ? page.items : [...prev, ...page.items]));
    setCursor(page.nextCursor);
    setHasMore(page.nextCursor !== null);

    if (isFirst) setLoading(false);
    else setLoadingMore(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage(null);
  }, [loadPage]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadPage(cursor);
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, loadingMore, loadPage]);

  if (loading) {
    return (
      <div className="-mb-20 grid h-[calc(100dvh-4rem)] place-items-center bg-black text-white md:mb-0">
        <div className="flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          <Typography variant="body-sm">Loading…</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="relative -mb-20 md:mb-0">
      <button
        type="button"
        onClick={() => setMuted((v) => !v)}
        title={muted ? "Unmute" : "Mute"}
        aria-label={muted ? "Unmute" : "Mute"}
        className="fixed right-4 top-20 z-50 grid size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70 lg:top-24"
      >
        {muted ? (
          <VolumeX className="size-4" />
        ) : (
          <Volume2 className="size-4" />
        )}
      </button>

      <div className="h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-scroll">
        {items.map((item) => (
          <DiscoverItem key={item.id} post={item} muted={muted} />
        ))}

        {hasMore ? (
          <div
            ref={sentinelRef}
            className="flex h-32 items-center justify-center bg-black text-white"
          >
            {loadingMore && (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <Typography variant="body-sm">Loading more…</Typography>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-40 snap-start flex-col items-center justify-center bg-black text-white">
            <Typography variant="heading-h4">That&apos;s a wrap.</Typography>
            <Typography variant="body-sm" className="text-white/60">
              Pull to refresh for new videos.
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
}
