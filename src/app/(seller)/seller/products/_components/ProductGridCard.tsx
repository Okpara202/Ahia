"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Zap } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import {
  deleteProduct,
  setProductVisibility,
} from "@/lib/actions/products";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import type { Boost, Product } from "@/types";
import { BoostSheet } from "./BoostSheet";
import { ProductCardActions } from "./ProductCardActions";

function shareProductToWhatsApp(product: Product) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://ahia.ng";
  const url = `${origin}/products/${product.id}`;
  const lines = [
    `${product.name} — ${formatNaira(product.price)}`,
    "",
    "Check it out on my Ahia shop, paid through escrow:",
    url,
  ];
  const text = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
}

interface ProductGridCardProps {
  product: Product;
  activeBoost?: Boost;
  onDelete?: (id: string) => void;
}

export function ProductGridCard({
  product,
  activeBoost,
  onDelete,
}: ProductGridCardProps) {
  const [hidden, setHidden] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const thumbUrl =
    product.media.type === "image"
      ? product.media.url
      : product.media.poster ?? "";

  const boosted = !!activeBoost;
  const [daysLeft] = useState(() =>
    activeBoost
      ? Math.max(
          0,
          Math.round(
            (new Date(activeBoost.endsAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0
  );

  async function toggleHide() {
    const next = !hidden;
    setHidden(next);
    try {
      await setProductVisibility(product.id, next);
      toast.success(
        next ? "Product hidden" : "Product visible again",
        next ? "Buyers won't see it in the feed." : "Live in the feed again."
      );
    } catch (err) {
      setHidden(!next);
      toast.error(
        "Couldn't update visibility",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    }
  }

  async function confirmDelete() {
    setDeleteOpen(false);
    try {
      await deleteProduct(product.id);
      onDelete?.(product.id);
      toast.success("Product deleted");
    } catch (err) {
      toast.error(
        "Couldn't delete product",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    }
  }

  return (
    <>
      <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
        <Link
          href={`/seller/products/${product.id}/edit`}
          aria-label={`Edit ${product.name}`}
          className="relative aspect-square w-full overflow-hidden bg-muted"
        >
          {thumbUrl && (
            <Image
              src={thumbUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
              className={cn(
                "object-cover transition-transform duration-200 group-hover:scale-[1.03]",
                hidden && "opacity-50"
              )}
            />
          )}
          {boosted && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
              <Zap className="size-3" />
              <Typography variant="label-sm">{daysLeft}d</Typography>
            </span>
          )}
          {hidden && (
            <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-foreground/80 px-2 py-0.5 text-background backdrop-blur">
              <Typography variant="label-sm">Hidden</Typography>
            </span>
          )}
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center bg-foreground/0 opacity-0 transition-opacity group-hover:bg-foreground/30 group-hover:opacity-100"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-foreground">
              <Pencil className="size-3.5" />
              <Typography variant="label-sm">Edit</Typography>
            </span>
          </span>
        </Link>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <Link
            href={`/seller/products/${product.id}/edit`}
            className="hover:text-primary"
          >
            <Typography variant="label-md" className="line-clamp-2">
              {product.name}
            </Typography>
          </Link>
          <div className="flex items-center justify-between gap-2">
            <Typography variant="price-md" className="text-primary">
              {formatNaira(product.price)}
            </Typography>
            <Typography variant="caption" className="text-muted-foreground">
              {product.category}
            </Typography>
          </div>

          <ProductCardActions
            productId={product.id}
            boosted={boosted}
            hidden={hidden}
            onBoost={() => setBoostOpen(true)}
            onShare={() => shareProductToWhatsApp(product)}
            onToggleHide={toggleHide}
            onDelete={() => setDeleteOpen(true)}
          />
        </div>
      </div>

      <BoostSheet
        product={product}
        open={boostOpen}
        onClose={() => setBoostOpen(false)}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                {product.name}
              </span>{" "}
              will be removed from your shop. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
