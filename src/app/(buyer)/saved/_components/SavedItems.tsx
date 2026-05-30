"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/Skeleton";
import { Typography } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/lib/services/products";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Product } from "@/types";

export function SavedItems() {
  const ids = useWishlistStore((s) => s.ids);
  const remove = useWishlistStore((s) => s.remove);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    Promise.all(
      ids.map(async (id) => {
        try {
          const product = await getProduct(id);
          return product ? { id, product } : { id, product: null };
        } catch {
          return { id, product: null };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const live = results
        .filter((r): r is { id: string; product: Product } => r.product !== null)
        .map((r) => r.product);
      const dead = results.filter((r) => r.product === null).map((r) => r.id);
      // Quietly drop ids the backend no longer recognizes (stale mock data,
      // soft-deleted products). The store sync is fire-and-forget.
      dead.forEach((id) => remove(id));
      setProducts(live);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [ids, remove]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 flex items-baseline justify-between gap-3">
        <Typography variant="heading-h1">Saved</Typography>
        {!loading && products.length > 0 && (
          <Typography variant="label-md" className="text-muted-foreground">
            {products.length} {products.length === 1 ? "item" : "items"}
          </Typography>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptySaved />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptySaved() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-12 text-center">
      <span
        aria-hidden
        className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary text-3xl"
      >
        ♡
      </span>
      <Typography variant="heading-h3">Nothing saved yet</Typography>
      <Typography variant="body-sm" className="max-w-sm text-muted-foreground">
        Tap the bookmark on any product to keep it here. Comes in handy when
        you&apos;re thinking about it but not buying yet.
      </Typography>
      <Button asChild variant="cta" size="lg" className="mt-2">
        <Link href="/feed">Back to feed</Link>
      </Button>
    </div>
  );
}
