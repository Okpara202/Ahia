"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, Upload, Video, X } from "lucide-react";

import { BoostPlanList } from "@/app/(seller)/seller/products/_components/BoostPlanList";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/Textarea";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import {
  purchaseDiscoverCampaign,
  uploadDiscoverPost,
} from "@/lib/services/discover";
import { BOOST_PLANS } from "@/lib/mocks/boosts";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import type { BoostPlanId, Product, Shop } from "@/types";
import { ProductPicker } from "./ProductPicker";

interface CreateAdFormProps {
  products: Product[];
  shop: Shop;
}

type Target = "product" | "shop";

export function CreateAdForm({ products, shop }: CreateAdFormProps) {
  const router = useRouter();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<Target>("product");
  const [productId, setProductId] = useState<string>(products[0]?.id ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [planId, setPlanId] = useState<BoostPlanId>("monthly");
  const [submitting, setSubmitting] = useState(false);

  const chosen = BOOST_PLANS.find((p) => p.id === planId) ?? BOOST_PLANS[0];
  const valid =
    videoFile !== null &&
    (target === "shop" || !!productId) &&
    (caption.trim().length === 0 || caption.length <= 140);

  function pickVideo() {
    videoInputRef.current?.click();
  }

  function handleVideoFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setVideoFile(f);
    setVideoPreviewUrl(URL.createObjectURL(f));
    e.target.value = "";
  }

  function pickPoster() {
    posterInputRef.current?.click();
  }

  function handlePosterFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPosterFile(f);
    setPosterPreviewUrl(URL.createObjectURL(f));
    e.target.value = "";
  }

  function clearPoster() {
    setPosterFile(null);
    setPosterPreviewUrl("");
  }

  async function handleSubmit() {
    if (!valid || !videoFile) return;
    setSubmitting(true);
    try {
      const post = await uploadDiscoverPost({
        videoFile,
        posterFile: posterFile ?? undefined,
        caption: caption.trim() || undefined,
        cta:
          target === "product"
            ? { type: "product", productId }
            : { type: "shop", shopId: shop.id },
      });
      const { authorization_url } = await purchaseDiscoverCampaign({
        postId: post.id,
        planId,
      });
      // Hand off to Paystack — server resolves the campaign on its webhook
      // and the return URL drops the seller back at the analytics page.
      window.location.href = authorization_url;
    } catch (err) {
      toast.error(
        "Couldn't create the ad",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
      setSubmitting(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <Typography variant="heading-h3">
          What does the ad send buyers to?
        </Typography>
        <div className="grid grid-cols-2 gap-2">
          <TargetCard
            active={target === "product"}
            onClick={() => setTarget("product")}
            label="A product"
            hint="Tapping the ad opens that product"
          />
          <TargetCard
            active={target === "shop"}
            onClick={() => setTarget("shop")}
            label="Your shop"
            hint="Tapping the ad opens your storefront"
          />
        </div>
        {target === "product" && (
          <ProductPicker
            products={products}
            selectedId={productId}
            onSelect={setProductId}
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <Typography variant="heading-h3">Your video</Typography>

        <div
          className={cn(
            "relative aspect-9/16 w-full max-w-xs overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted",
            videoPreviewUrl && "border-solid border-primary"
          )}
        >
          {videoPreviewUrl ? (
            <>
              <video
                src={videoPreviewUrl}
                muted
                playsInline
                autoPlay
                loop
                className="absolute inset-0 h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={pickVideo}
                className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-foreground backdrop-blur transition-colors hover:bg-background"
              >
                <Upload className="size-3.5" />
                <Typography variant="label-sm">Replace</Typography>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={pickVideo}
              className="absolute inset-0 grid place-items-center gap-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Video className="size-6" />
              <Typography variant="label-md">Choose a video</Typography>
              <Typography variant="caption">
                Vertical, 9–30 seconds
              </Typography>
            </button>
          )}
        </div>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoFile}
        />

        <div className="flex items-center gap-3">
          {posterPreviewUrl ? (
            <div className="relative size-16 overflow-hidden rounded-xl border border-border bg-muted">
              <Image
                src={posterPreviewUrl}
                alt="Poster preview"
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={clearPoster}
                aria-label="Remove poster"
                className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={pickPoster}
          >
            <Upload className="size-4" />
            {posterPreviewUrl ? "Replace poster" : "Add poster image (optional)"}
          </Button>
          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePosterFile}
          />
        </div>

        <Textarea
          label="Caption (optional)"
          placeholder="Last 3 in stock — free Lagos delivery today"
          rows={2}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          helperText={`${caption.length}/140`}
          error={
            caption.length > 140 ? "Keep it under 140 characters" : undefined
          }
        />
      </section>

      <section className="flex flex-col gap-3">
        <Typography variant="heading-h3">Pick a plan</Typography>
        <BoostPlanList planId={planId} onSelect={setPlanId} />
      </section>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
        <Typography variant="caption" className="text-muted-foreground">
          You&apos;ll pay
        </Typography>
        <Typography variant="display-md" className="text-foreground">
          {formatNaira(chosen.priceNaira)}
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Runs for {chosen.months} {chosen.months === 1 ? "month" : "months"}.
          Cancel anytime; no auto-renew.
        </Typography>
      </div>

      <Button
        onClick={handleSubmit}
        variant="cta"
        size="lg"
        disabled={!valid || submitting}
      >
        <ShieldCheck className="size-4" />
        {submitting
          ? "Uploading & opening Paystack…"
          : `Pay ${formatNaira(chosen.priceNaira)} & launch`}
      </Button>
    </div>
  );
}

interface TargetCardProps {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}

function TargetCard({ active, onClick, label, hint }: TargetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex flex-col gap-1 rounded-2xl border-2 border-primary bg-primary/[0.04] p-4 text-left"
          : "flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
      }
    >
      <Typography variant="label-lg">{label}</Typography>
      <Typography variant="caption" className="text-muted-foreground">
        {hint}
      </Typography>
    </button>
  );
}
