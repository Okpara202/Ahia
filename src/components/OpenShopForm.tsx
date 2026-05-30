"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Typography } from "@/components/Typography";
import { apiClient, extractApiError } from "@/lib/api";
import { createShop } from "@/lib/services/seller";
import { useAuthStore } from "@/store/authStore";
import { useSellerShopStore } from "@/store/sellerShopStore";
import { toast } from "@/store/toastStore";

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
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [location, setLocation] = useState("Lagos");
  const [bio, setBio] = useState("");
  const [showLegalName, setShowLegalName] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

      const shop = await createShop({
        name: name.trim(),
        handle: handle.trim().toLowerCase(),
        category,
        location: location === "Other" ? undefined : location,
        bio: bio.trim() || undefined,
        showLegalName,
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
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
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
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {LOCATIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Typography variant="caption" className="text-muted-foreground">
            Helps buyers nearby find your shop. Pick &ldquo;Other&rdquo; to skip
            for now.
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
