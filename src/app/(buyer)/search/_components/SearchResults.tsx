"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { LocationFilter } from "@/components/LocationFilter";
import { ProductCard } from "@/components/ProductCard";
import { Typography } from "@/components/Typography";
import { QuickViewSheet } from "@/app/(buyer)/feed/_components/QuickViewSheet";
import {
  searchProducts,
  type LocationFilter as LocationValue,
} from "@/lib/services/products";
import { searchShops } from "@/lib/services/shops";
import { cn } from "@/lib/utils";
import type { Product, Shop } from "@/types";
import { SearchHero } from "./SearchHero";
import { ShopResult } from "./ShopResult";

type Tab = "products" | "shops";

export function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();
  // Allow `/search?q=…` (text search) and `/search?category=…` (category chip
  // from landing) — the latter is treated as a free-text query against
  // category names, which `searchProducts` already matches on.
  const initialQ = params.get("q") ?? params.get("category") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [location, setLocation] = useState<LocationValue>("All Nigeria");
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null
  );

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([searchProducts(query, location), searchShops(query)]).then(
      ([p, s]) => {
        if (!active) return;
        setProducts(p);
        setShops(s);
        setLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, [query, location]);

  function applyQuery(q: string) {
    setQuery(q);
    setInputValue(q);
    const search = q ? `?q=${encodeURIComponent(q)}` : "";
    router.replace(`/search${search}`);
  }

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    applyQuery(inputValue.trim());
  }

  // Mobile keyboards don't always show a Search/Enter key prominently — auto-
  // trigger search 300ms after the user pauses typing. Desktop Enter still
  // works (and fires immediately).
  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed === query) return;
    const handle = setTimeout(() => applyQuery(trimmed), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleSearch}
          autoFocus
          placeholder="Search products, shops, sellers…"
          className="h-12 w-full rounded-full border border-input bg-card pl-11 pr-4 text-base shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-input/30"
        />
      </div>

      {query === "" ? (
        <SearchHero onPick={applyQuery} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <div className="flex">
              <TabButton
                active={tab === "products"}
                onClick={() => setTab("products")}
                label={`Products${products.length ? ` · ${products.length}` : ""}`}
              />
              <TabButton
                active={tab === "shops"}
                onClick={() => setTab("shops")}
                label={`Shops${shops.length ? ` · ${shops.length}` : ""}`}
              />
            </div>
            <div className="pb-2">
              <LocationFilter value={location} onChange={setLocation} />
            </div>
          </div>

          {loading ? (
            <Typography variant="body-sm" className="text-muted-foreground">
              Searching…
            </Typography>
          ) : tab === "products" ? (
            products.length === 0 ? (
              <EmptyState query={query} kind="products" />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelect={setQuickViewProduct}
                  />
                ))}
              </div>
            )
          ) : shops.length === 0 ? (
            <EmptyState query={query} kind="shops" />
          ) : (
            <div className="flex flex-col gap-3">
              {shops.map((s) => (
                <ShopResult key={s.id} shop={s} />
              ))}
            </div>
          )}
        </>
      )}

      <QuickViewSheet
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-4 py-3 transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      <Typography variant="label-lg">{label}</Typography>
    </button>
  );
}

function EmptyState({ query, kind }: { query: string; kind: string }) {
  return (
    <Typography variant="body-md" className="text-muted-foreground">
      {query
        ? `No ${kind} match "${query}".`
        : `Type something above to find ${kind}.`}
    </Typography>
  );
}
