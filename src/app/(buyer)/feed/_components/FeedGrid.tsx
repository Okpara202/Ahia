"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { LocationFilter } from "@/components/LocationFilter";
import { ProductCard } from "@/components/ProductCard";
import { Typography } from "@/components/Typography";
import { getFeed, type LocationFilter as LocationValue } from "@/lib/services/products";
import type { Product } from "@/types";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { QuickViewSheet } from "./QuickViewSheet";

const SKELETON_COUNT = 8;
const GRID_CLASSES =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6";

export function FeedGrid() {
  const [location, setLocation] = useState<LocationValue>("All Nigeria");
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (cursorArg: string | null, loc: LocationValue) => {
      const isFirst = cursorArg === null;
      if (isFirst) setLoading(true);
      else setLoadingMore(true);

      const page = await getFeed({ cursor: cursorArg, location: loc });

      setProducts((prev) =>
        isFirst ? page.products : [...prev, ...page.products]
      );
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);

      if (isFirst) setLoading(false);
      else setLoadingMore(false);
    },
    []
  );

  // (Re)load when location changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage(null, location);
  }, [loadPage, location]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadPage(cursor, location);
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, loadingMore, loadPage, location]);

  // Hide the filter chip when there's nothing to filter — better than offering
  // cities the database doesn't actually have shops in. Re-shows once any
  // products land, and once the backend exposes a real `/locations` facet
  // this becomes a server-driven list instead of the static seven.
  const showFilter =
    !loading && (products.length > 0 || location !== "All Nigeria");

  return (
    <>
      {showFilter && (
        <div className="sticky top-16 z-10 -mx-4 mb-4 flex gap-2 bg-background/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <LocationFilter value={location} onChange={setLocation} />
        </div>
      )}

      {loading ? (
        <div className={GRID_CLASSES}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Typography variant="heading-h4">No shops in {location} yet</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Switch to All Nigeria or check back as more sellers join.
          </Typography>
        </div>
      ) : (
        <>
          <div className={GRID_CLASSES}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={setQuickViewProduct}
              />
            ))}
          </div>

          <QuickViewSheet
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
          />

          {hasMore ? (
            <div
              ref={sentinelRef}
              className="flex items-center justify-center py-10"
            >
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <Typography variant="body-sm">Loading more…</Typography>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-12 text-center">
              <Typography variant="heading-h4">You&apos;ve seen it all.</Typography>
              <Typography variant="body-sm" className="text-muted-foreground">
                Pull to refresh, or check back soon for new shops.
              </Typography>
            </div>
          )}
        </>
      )}
    </>
  );
}
