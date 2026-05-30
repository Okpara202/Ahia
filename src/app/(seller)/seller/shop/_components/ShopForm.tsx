"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Typography } from "@/components/Typography";
import { apiClient, extractApiError } from "@/lib/api";
import { useSellerShopStore } from "@/store/sellerShopStore";
import { toast } from "@/store/toastStore";
import type { Shop } from "@/types";

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

interface ShopFormProps {
  shop: Shop;
}

export function ShopForm({ shop }: ShopFormProps) {
  const [name, setName] = useState(shop.name);
  const [handle, setHandle] = useState(shop.handle.replace(/^@/, ""));
  const [bio, setBio] = useState(shop.bio ?? "");
  const [category, setCategory] = useState("Fashion");
  const [showLegalName, setShowLegalName] = useState(shop.showLegalName ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      // Owner is implicit (one shop per user); backend looks up the seller
      // via the session cookie and rejects a path id you don't own.
      await apiClient().patch("/shops/me", {
        name: name.trim(),
        handle: handle.trim(),
        bio: bio.trim(),
        category,
        showLegalName,
      });
      // Reflect the edits in the seller shell sidebar + dashboard header
      // immediately, without waiting for a hard refresh.
      useSellerShopStore.getState().patchShop({
        name: name.trim(),
        handle: handle.trim(),
        bio: bio.trim(),
        showLegalName,
      });
      toast.success(
        "Shop saved",
        "Your changes are live on your storefront."
      );
    } catch (err) {
      toast.error(
        "Couldn't save shop",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <Input
        label="Shop name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        helperText="This is your public name. It doesn't have to match your legal name."
      />

      <Input
        label="Handle"
        value={handle}
        onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
        helperText="Lowercase letters, numbers, dots, dashes."
        rightAdornment={
          <Typography variant="label-sm" className="pr-2 text-muted-foreground">
            @
          </Typography>
        }
      />

      <div className="flex w-full flex-col gap-1.5">
        <Typography variant="label-sm" as="span">
          Primary category
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

      <Textarea
        label="Description"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={4}
        helperText="Tell buyers what you sell, where you ship, anything that builds trust."
      />

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4 hover:bg-muted/40">
        <input
          type="checkbox"
          checked={showLegalName}
          onChange={(e) => setShowLegalName(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Typography variant="label-md">
            Show my real name on the storefront
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            Off by default. Many sellers prefer to stay pseudonymous — buyers
            see the shop name and handle only.
          </Typography>
        </div>
      </label>

      <div className="flex pt-2">
        <Button
          type="button"
          variant="cta"
          size="lg"
          onClick={handleSave}
          disabled={saving || !name.trim() || !handle.trim()}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
