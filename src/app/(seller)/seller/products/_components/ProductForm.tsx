"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { createProduct, updateProduct } from "@/lib/services/products";
import { toast } from "@/store/toastStore";
import type { Product } from "@/types";
import {
  ProductImagesField,
  type ProductImageItem,
} from "./ProductImagesField";

const CATEGORIES = [
  "Fashion",
  "Accessories",
  "Beauty",
  "Electronics",
  "Phones",
  "Books",
  "Snacks",
  "Stationery",
];

function initialItems(p?: Product): ProductImageItem[] {
  if (!p) return [];
  const cover =
    p.media.type === "image" ? p.media.url : (p.media.poster ?? "");
  const gallery = (p.gallery ?? []).map((g) =>
    g.type === "image" ? g.url : (g.poster ?? "")
  );
  return [cover, ...gallery]
    .filter(Boolean)
    .map((url) => ({ kind: "url" as const, url }));
}

interface ProductFormProps {
  initial?: Product;
  mode: "create" | "edit";
}

export function ProductForm({ initial, mode }: ProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price.toString() ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Fashion");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [items, setItems] = useState<ProductImageItem[]>(initialItems(initial));
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canSave = !!name.trim() && !!price.trim() && items.length > 0 && !saving;

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("price", price.trim());
    fd.append("category", category);
    fd.append("description", description.trim());
    // Cover is always index 0 of the items array (ProductImagesField enforces).
    fd.append("cover_index", "0");
    // Backend's multer config uses `upload.array('image_files', 10)` — bare
    // field name, no PHP-style brackets. Repeated appends become the array.
    for (const item of items) {
      if (item.kind === "file") {
        fd.append("image_files", item.file);
      } else {
        fd.append("image_urls", item.url);
      }
    }
    return fd;
  }

  async function handleSave() {
    setSaving(true);
    setFieldErrors({});
    try {
      const fd = buildFormData();
      if (mode === "edit" && initial) {
        await updateProduct(initial.id, fd);
      } else {
        await createProduct(fd);
      }
      toast.success(
        mode === "edit" ? "Product updated" : "Product published"
      );
      router.push("/seller/products");
      router.refresh();
    } catch (err) {
      const apiErr = extractApiError(err);
      // Log to console.warn (not error) so Next.js's dev overlay doesn't
      // surface this as a crash — it's a caught, handled API error and the
      // user sees a toast. The console line is purely for debugging.
      console.warn("[product-publish] failed", { error: err, apiErr });
      if (apiErr?.fields) {
        setFieldErrors(apiErr.fields);
      } else {
        toast.error(
          mode === "edit" ? "Couldn't save changes" : "Couldn't publish",
          apiErr?.message ?? "Try again in a moment."
        );
      }
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Input
        label="Product name"
        placeholder="e.g. Vintage silk slip dress — size 8"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="Price"
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={fieldErrors.price}
          rightAdornment={
            <Typography variant="label-sm" className="pr-2">
              ₦
            </Typography>
          }
        />
        <div className="flex w-full flex-col gap-1.5">
          <Typography variant="label-sm" as="span">
            Category
          </Typography>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Textarea
        label="Description"
        placeholder="Condition, size, pickup or delivery options…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        error={fieldErrors.description}
      />

      <ProductImagesField
        items={items}
        onChange={setItems}
        error={
          fieldErrors.image_files ??
          fieldErrors.image_urls ??
          fieldErrors.images
        }
      />

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          type="button"
          variant="cta"
          size="lg"
          onClick={handleSave}
          disabled={!canSave}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving
            ? mode === "edit"
              ? "Saving…"
              : "Publishing…"
            : mode === "edit"
              ? "Save changes"
              : "Publish product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
