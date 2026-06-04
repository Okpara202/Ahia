"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Loader2,
  Store,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Typography } from "@/components/Typography";
import { apiClient, extractApiError } from "@/lib/api";
import { compressImageIfNeeded, formatBytes } from "@/lib/image";
import { createShop } from "@/lib/services/seller";
import { useAuthStore } from "@/store/authStore";
import { useSellerShopStore } from "@/store/sellerShopStore";
import { toast } from "@/store/toastStore";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

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

// Nigerian cities offered as primary location. Backend accepts free-form
// strings, but a curated dropdown keeps spelling consistent and unlocks
// the location filter on the buyer feed.
const LOCATIONS = [
  "Lagos",
  "Abuja",
  "Ibadan",
  "Port Harcourt",
  "Kano",
  "Enugu",
  "Benin City",
  "Calabar",
  "Jos",
  "Owerri",
  "Other",
];

interface OpenShopFormProps {
  /** Where to send the user after the shop is created. */
  onCreated?: () => void;
}

/**
 * Single shop-creation form used everywhere a user can "open a shop" —
 * brand-new sellers from onboarding, existing buyers flipping role, or
 * sellers landing on /seller without a shop yet. One form, one POST /shops
 * call, one router push. Backend infers the owner from the session cookie.
 */
export function OpenShopForm({ onCreated }: OpenShopFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [location, setLocation] = useState("Lagos");
  const [customLocation, setCustomLocation] = useState("");
  const [bio, setBio] = useState("");
  const [showLegalName, setShowLegalName] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [optimizingAvatar, setOptimizingAvatar] = useState(false);

  // Release any blob URL we hold when the form unmounts.
  useEffect(() => {
    return () => {
      if (avatar) URL.revokeObjectURL(avatar.previewUrl);
    };
  }, [avatar]);

  async function handleAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setOptimizingAvatar(true);
    try {
      const result = await compressImageIfNeeded(file);
      if (result.file.size > MAX_FILE_BYTES) {
        toast.error(
          "Logo is too large",
          `Even after optimizing, ${formatBytes(
            result.file.size
          )} is over the limit.`
        );
        return;
      }
      if (avatar) URL.revokeObjectURL(avatar.previewUrl);
      setAvatar({
        file: result.file,
        previewUrl: URL.createObjectURL(result.file),
      });
      if (result.compressed) {
        toast.success(
          "Optimized for faster upload",
          `${formatBytes(result.originalBytes)} → ${formatBytes(
            result.outputBytes
          )}.`
        );
      }
    } catch (err) {
      console.warn("[shop-avatar-compress] failed", err);
      toast.error(
        "Couldn't read that image",
        "Try a different file or use JPEG/PNG."
      );
    } finally {
      setOptimizingAvatar(false);
    }
  }

  function clearAvatar() {
    if (avatar) URL.revokeObjectURL(avatar.previewUrl);
    setAvatar(null);
  }

  const canSubmit = name.trim().length > 0 && handle.trim().length > 0;

  async function handleCreate() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setFieldErrors({});
    try {
      // Flip role first so the user is a "seller" by the time their shop
      // is created. The backend allows POST /shops regardless of role, but
      // this keeps the user record consistent with what they're about to do.
      const currentRole = useAuthStore.getState().user?.role;
      if (currentRole !== "seller") {
        await apiClient().patch("/users/role", { role: "seller" });
        useAuthStore.setState((s) => ({
          user: s.user ? { ...s.user, role: "seller" } : s.user,
          activeRole: "seller",
        }));
      }

      // "Other" reveals a free-text input — send whatever the user typed.
      // Skip if they left it blank.
      const trimmedCustom = customLocation.trim();
      const resolvedLocation =
        location === "Other" ? trimmedCustom || undefined : location;

      const shop = await createShop({
        name: name.trim(),
        handle: handle.trim().toLowerCase(),
        category,
        location: resolvedLocation,
        bio: bio.trim() || undefined,
        showLegalName,
        avatarFile: avatar?.file,
      });
      // Seed the store so SellerShellGate immediately renders the full
      // shell on the next route without re-fetching.
      useSellerShopStore.getState().setShop(shop);

      // Identity-level event — promote to the center pill so the user
      // actually notices they've crossed into seller-land.
      toast.confirm("Shop opened", "You can start adding products now.");
      onCreated?.();
      router.push("/seller");
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr?.code === "handle_taken") {
        setFieldErrors({ handle: "That handle is already in use." });
      } else if (apiErr?.code === "invalid_handle") {
        setFieldErrors({
          handle: "Use lowercase letters, numbers, dots, dashes.",
        });
      } else if (apiErr?.code === "shop_exists") {
        // Edge case: somehow they already have a shop. Bounce them in.
        toast.success("You already have a shop", "Taking you to it…");
        router.push("/seller");
      } else if (apiErr?.fields) {
        setFieldErrors(apiErr.fields);
      } else {
        toast.error(
          "Couldn't open your shop",
          apiErr?.message ?? "Try again in a moment."
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"
        >
          <Store className="size-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <Typography variant="heading-h2">Open your shop</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Takes about 30 seconds. You can edit any of this later.
          </Typography>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={optimizingAvatar}
            aria-label={avatar ? "Replace shop logo" : "Add shop logo"}
            className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {optimizingAvatar ? (
              <Loader2 className="size-5 animate-spin" />
            ) : avatar ? (
              <>
                <Image
                  src={avatar.previewUrl}
                  alt="Shop logo preview"
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute inset-0 flex items-end justify-center bg-linear-to-t from-foreground/60 to-transparent pb-1.5 opacity-0 transition-opacity hover:opacity-100">
                  <Upload className="size-4 text-background" />
                </span>
              </>
            ) : (
              <Camera className="size-6" />
            )}
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Typography variant="label-md">
              {avatar ? "Looking good" : "Add a shop logo"}
            </Typography>
            <Typography variant="caption" className="text-muted-foreground">
              {avatar
                ? "Buyers will see this next to your shop name."
                : "Optional, but trusted shops have one. Square works best."}
            </Typography>
            {avatar && (
              <button
                type="button"
                onClick={clearAvatar}
                className="mt-1 inline-flex w-fit items-center gap-1 text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3" />
                <Typography variant="caption">Remove</Typography>
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarPick}
        />

        <div className="h-px bg-border" aria-hidden />

        <Input
          label="Shop name"
          placeholder="e.g. Chi's Closet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          helperText="Public name shown in the feed and on your storefront."
          error={fieldErrors.name}
          autoFocus
        />

        <Input
          label="Handle"
          placeholder="chiscloset"
          value={handle}
          onChange={(e) =>
            setHandle(e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase())
          }
          helperText="Lowercase letters, numbers, dots, dashes. Becomes your @-tag."
          error={fieldErrors.handle}
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
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none scheme-light focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:scheme-dark"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-background text-foreground">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <Typography variant="label-sm" as="span">
            Location
          </Typography>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none scheme-light focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:scheme-dark"
          >
            {LOCATIONS.map((c) => (
              <option key={c} value={c} className="bg-background text-foreground">
                {c}
              </option>
            ))}
          </select>
          {location === "Other" && (
            <Input
              placeholder="e.g. Uyo, Asaba, Akure"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              aria-label="Custom location"
            />
          )}
          <Typography variant="caption" className="text-muted-foreground">
            Helps buyers nearby find your shop. Pick &ldquo;Other&rdquo; to type
            a city not in the list, or leave blank to skip.
          </Typography>
        </div>

        <Textarea
          label="Short description"
          placeholder="What you sell, where you ship from, anything that builds trust."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          helperText="Optional — you can add this later."
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
              Off by default. Most sellers stay pseudonymous — buyers see the
              shop name and handle only.
            </Typography>
          </div>
        </label>
      </div>

      <Button
        type="button"
        variant="cta"
        size="lg"
        onClick={handleCreate}
        disabled={!canSubmit || submitting}
        className="w-full"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "Opening your shop…" : "Open shop"}
        {!submitting && <ArrowRight className="size-4" />}
      </Button>
    </div>
  );
}
