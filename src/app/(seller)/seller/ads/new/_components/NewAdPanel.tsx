"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Typography } from "@/components/Typography";
import { getMyProducts } from "@/lib/services/seller";
import { useSellerShopStore } from "@/store/sellerShopStore";
import type { Product } from "@/types";
import { CreateAdForm } from "./CreateAdForm";

export function NewAdPanel() {
  const shop = useSellerShopStore((s) => s.shop);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!shop) return;
    let cancelled = false;
    getMyProducts(shop.id)
      .then((p) => {
        if (cancelled) return;
        setProducts(p);
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
          aria-label="Loading"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Link
        href="/seller/ads"
        className="inline-flex w-fit items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <Typography variant="label-sm">Back to ads</Typography>
      </Link>

      <header className="flex flex-col gap-1">
        <Typography variant="heading-h1">Create a Discover ad</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Upload a short vertical video. Buyers scrolling Discover will see it
          in a guaranteed paid slot.
        </Typography>
      </header>

      <CreateAdForm products={products} shop={shop} />
    </div>
  );
}
