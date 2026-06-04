"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import type { DiscoverPost } from "@/types";
import { AdRow } from "./AdRow";

type Status = "all" | "boosted" | "organic" | "expired";

interface AdsListClientProps {
  posts: DiscoverPost[];
}

const STATUS_FILTERS: { id: Status; label: string }[] = [
  { id: "all", label: "All" },
  { id: "boosted", label: "Boosted" },
  { id: "organic", label: "Organic" },
  { id: "expired", label: "Expired" },
];

function classify(
  post: DiscoverPost,
  now: number
): "boosted" | "organic" | "expired" {
  const expired = post.expiresAt
    ? new Date(post.expiresAt).getTime() < now
    : false;
  if (expired) return "expired";
  if (post.sponsored) return "boosted";
  return "organic";
}

export function AdsListClient({ posts }: AdsListClientProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [now] = useState(() => Date.now());

  const counts = useMemo(() => {
    const tally = { all: posts.length, boosted: 0, organic: 0, expired: 0 };
    for (const p of posts) {
      tally[classify(p, now)] += 1;
    }
    return tally;
  }, [posts, now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const cls = classify(p, now);
      if (status !== "all" && cls !== status) return false;
      if (!q) return true;
      return (p.caption ?? "").toLowerCase().includes(q);
    });
  }, [posts, query, status, now]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts by caption…"
          className="h-11 w-full rounded-full border border-input bg-card pl-10 pr-10 text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-input/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = f.id === status;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatus(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              <Typography variant="label-sm">
                {f.label} ({counts[f.id]})
              </Typography>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-10 text-center">
          <Typography variant="heading-h4">No matches</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Nothing here matches{query && ` "${query}"`}
            {status !== "all" && ` in ${status}`}. Try a different filter.
          </Typography>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {filtered.map((p) => (
              <AdRow key={p.id} post={p} status={classify(p, now)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
