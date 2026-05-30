"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Typography } from "@/components/Typography";
import { getProduct } from "@/lib/services/products";
import type { Product } from "@/types";
import { ProductForm } from "../../../_components/ProductForm";

interface EditProductPanelProps {
  id: string;
}

export function EditProductPanel({ id }: EditProductPanelProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProduct(id)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2
          aria-label="Loading product"
          className="size-6 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  if (!product) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-1">
        <Typography variant="heading-h1">Edit product</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Changes go live as soon as you save.
        </Typography>
      </header>
      <ProductForm mode="edit" initial={product} />
    </div>
  );
}
