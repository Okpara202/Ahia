"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Typography } from "@/components/Typography";
import { UploadOverlay } from "@/components/UploadOverlay";
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
  const [uploadPercent, setUploadPercent] = useState<number | undefined>(
    undefined
  );
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
    setUploadPercent(0);
    setFieldErrors({});
    try {
      const fd = buildFormData();
      if (mode === "edit" && initial) {
        await updateProduct(initial.id, fd, setUploadPercent);
      } else {
        await createProduct(fd, setUploadPercent);
      }
      setUploadPercent(undefined);
      toast.success(
        mode === "edit" ? "Product updated" : "Product published"
      );
      router.push("/seller/products");
      router.refresh();
    } catch (err) {
      const apiErr = extractApiError(err);
      // Dump everything we can about the failed request so a 500 from backend
      // is debuggable from the browser console alone (no need for Render logs).
      const debug: Record<string, unknown> = { apiErr };
      if (axios.isAxiosError(err)) {
        debug.status = err.response?.status;
        debug.statusText = err.response?.statusText;
        debug.responseBody = err.response?.data;
        debug.requestUrl = err.config?.url;
        debug.requestMethod = err.config?.method;
        // Stringify the FormData so we can see what was actually shipped.
        const fdSummary: Record<string, string | string[]> = {};
        for (const [k, v] of (
          err.config?.data instanceof FormData
            ? err.config.data
            : new FormData()
        ).entries()) {
          const display =
            v instanceof File
              ? `<File name="${v.name}" size=${v.size} type="${v.type}">`
              : String(v);
          const existing = fdSummary[k];
          if (existing === undefined) {
            fdSummary[k] = display;
          } else if (Array.isArray(existing)) {
            existing.push(display);
          } else {
            fdSummary[k] = [existing, display];
          }
        }
        debug.requestPayload = fdSummary;
      }
      console.warn("[product-publish] failed", debug);
      if (apiErr?.fields) {
        setFieldErrors(apiErr.fields);
      } else {
        toast.error(
          mode === "edit" ? "Couldn't save changes" : "Couldn't publish",
          apiErr?.message ?? "Try again in a moment.",
          apiErr?.requestId
        );
      }
      setSaving(false);
      setUploadPercent(undefined);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <UploadOverlay
        open={saving}
        progress={uploadPercent}
        title={mode === "edit" ? "Saving your changes…" : "Publishing your product…"}
        hint="Keep this tab open — we'll let you know when it's done."
      />
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
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none scheme-light focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:scheme-dark"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-background text-foreground">
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
