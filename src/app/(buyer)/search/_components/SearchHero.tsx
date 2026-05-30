"use client";

import {
  BookOpen,
  Cookie,
  Laptop,
  Search as SearchIcon,
  Shirt,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Typography } from "@/components/Typography";

interface SearchHeroProps {
  onPick: (query: string) => void;
}

const TRENDING: { label: string; q: string }[] = [
  { label: "Y2K jackets", q: "Y2K" },
  { label: "iPhone", q: "iPhone" },
  { label: "AF1 sneakers", q: "Nike" },
  { label: "Ankara", q: "Ankara" },
  { label: "MacBook", q: "MacBook" },
  { label: "Vintage thrift", q: "vintage" },
];

const CATEGORIES: { label: string; q: string; icon: LucideIcon }[] = [
  { label: "Fashion", q: "Fashion", icon: Shirt },
  { label: "Electronics", q: "Electronics", icon: Laptop },
  { label: "Phones", q: "Phones", icon: Smartphone },
  { label: "Beauty", q: "Beauty", icon: Sparkles },
  { label: "Books", q: "Books", icon: BookOpen },
  { label: "Snacks", q: "Snacks", icon: Cookie },
];

export function SearchHero({ onPick }: SearchHeroProps) {
  return (
    <div className="flex flex-col gap-8 py-4 sm:py-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"
        >
          <SearchIcon className="size-5" />
        </span>
        <Typography variant="heading-h1">
          Find anything from Nigerian sellers
        </Typography>
        <Typography
          variant="body-md"
          className="max-w-md text-muted-foreground"
        >
          Search for a product, a shop, or a vibe. Pay only after the package
          lands at your door.
        </Typography>
      </header>

      <section className="flex flex-col gap-3">
        <Typography variant="overline" className="text-muted-foreground">
          Try searching for
        </Typography>
        <div className="flex flex-wrap gap-2">
          {TRENDING.map(({ label, q }) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
            >
              <Typography variant="label-sm">{label}</Typography>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Typography variant="overline" className="text-muted-foreground">
          Browse by category
        </Typography>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ label, q, icon: Icon }) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="size-5" />
              </span>
              <Typography variant="label-md">{label}</Typography>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
