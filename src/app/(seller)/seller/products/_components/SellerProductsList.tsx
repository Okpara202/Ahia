"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";

import { EmptyProductsIllustration } from "@/components/illustrations";
import { Typography } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Boost, Product } from "@/types";
import { ProductGridCard } from "./ProductGridCard";

interface SellerProductsListProps {
  products: Product[];
  boosts: Boost[];
}

export function SellerProductsList({ products, boosts }: SellerProductsListProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());

  const visibleProducts = useMemo(
    () => products.filter((p) => !deletedIds.has(p.id)),
    [products, deletedIds]
  );

  const boostByProduct = useMemo(
    () => new Map(boosts.map((b) => [b.productId, b])),
    [boosts]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    visibleProducts.forEach((p) => set.add(p.category));
    return ["All", ...Array.from(set).sort()];
  }, [visibleProducts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleProducts.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [visibleProducts, query, category]);

  function handleDelete(id: string) {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // TODO: DELETE /products/:id once backend lands.
  }

  if (visibleProducts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <EmptyProductsIllustration className="size-36 text-primary/40" />
        <Typography variant="heading-h3">No products yet</Typography>
        <Typography variant="body-sm" className="max-w-sm text-muted-foreground">
          Drop your first listing. The moment it goes live, it can show up in
          the feed for any buyer scrolling.
        </Typography>
        <Button asChild variant="cta" size="lg" className="mt-2">
          <Link href="/seller/products/new">
            <Plus className="size-4" />
            Add your first product
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
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
            placeholder="Search your products by name, category, or description…"
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

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                <Typography variant="label-sm">{c}</Typography>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Typography variant="heading-h4">No matches</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Nothing here matches{query && ` "${query}"`}
            {category !== "All" && ` in ${category}`}. Try a different filter.
          </Typography>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductGridCard
              key={p.id}
              product={p}
              activeBoost={boostByProduct.get(p.id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
