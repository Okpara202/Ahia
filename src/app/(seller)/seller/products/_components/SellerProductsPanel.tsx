"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { getActiveBoostsForShop } from "@/lib/services/boosts";
import { getMyProducts } from "@/lib/services/seller";
import { useSellerShopStore } from "@/store/sellerShopStore";
import type { Boost, Product } from "@/types";
import { SellerProductsList } from "./SellerProductsList";

export function SellerProductsPanel() {
  const shop = useSellerShopStore((s) => s.shop);
  const [products, setProducts] = useState<Product[]>([]);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!shop) return;
    let cancelled = false;
    Promise.all([getMyProducts(shop.id), getActiveBoostsForShop(shop.id)])
      .then(([p, b]) => {
        if (cancelled) return;
        setProducts(p);
        setBoosts(b);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [shop]);

  if (!shop || !loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2
          aria-label="Loading products"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Typography variant="heading-h1">Products</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            {products.length} listed
          </Typography>
        </div>
        <Button asChild variant="cta" size="lg">
          <Link href="/seller/products/new">
            <Plus className="size-4" />
            Add product
          </Link>
        </Button>
      </header>

      <SellerProductsList products={products} boosts={boosts} />
    </div>
  );
}
