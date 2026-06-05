"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ShieldCheck, Upload, Video, X } from "lucide-react";

import { BoostPlanList } from "@/app/(seller)/seller/products/_components/BoostPlanList";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/Textarea";
import { Typography } from "@/components/Typography";
import { UploadOverlay } from "@/components/UploadOverlay";
import { extractApiError } from "@/lib/api";
import {
  purchaseDiscoverCampaign,
  uploadDiscoverPost,
} from "@/lib/services/discover";
import { compressImageIfNeeded, formatBytes } from "@/lib/image";
import { BOOST_PLANS } from "@/lib/mocks/boosts";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";
import type { BoostPlanId, Product, Shop } from "@/types";
import { ProductPicker } from "./ProductPicker";

// Backend cap is 50 MB for Discover videos (per upload error code reference
// FILE_TOO_LARGE). Reject client-side with a useful message instead of
// burning the seller's upload budget on a request the server will refuse.
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
// Poster is a regular image — same 5 MB limit as product / shop avatar.
const MAX_POSTER_BYTES = 5 * 1024 * 1024;

interface CreateAdFormProps {
  products: Product[];
  shop: Shop;
}

type Target = "product" | "shop";
type Mode = "free" | "boost";

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
  // Default to "boost" — paid is the recommended path and converts better.
  // Users who want free toggle off explicitly.
  const [mode, setMode] = useState<Mode>("boost");
  const [planId, setPlanId] = useState<BoostPlanId>("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | undefined>(
    undefined
  );

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
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_VIDEO_BYTES) {
      toast.error(
        "Video is too large",
        `${formatBytes(f.size)} — please trim it to under ${formatBytes(
          MAX_VIDEO_BYTES
        )} and try again. Most phones have a built-in trim tool.`
      );
      return;
    }
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(f);
    setVideoPreviewUrl(URL.createObjectURL(f));
  }

  function pickPoster() {
    posterInputRef.current?.click();
  }

  async function handlePosterFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const result = await compressImageIfNeeded(f);
      if (result.file.size > MAX_POSTER_BYTES) {
        toast.error(
          "Poster is too large",
          `Even after optimizing, ${formatBytes(
            result.file.size
          )} is over the limit.`
        );
        return;
      }
      if (posterPreviewUrl) URL.revokeObjectURL(posterPreviewUrl);
      setPosterFile(result.file);
      setPosterPreviewUrl(URL.createObjectURL(result.file));
      if (result.compressed) {
        toast.success(
          "Optimized for faster upload",
          `${formatBytes(result.originalBytes)} → ${formatBytes(
            result.outputBytes
          )}.`
        );
      }
    } catch (err) {
      console.warn("[ad-poster-compress] failed", err);
      toast.error(
        "Couldn't read that image",
        "Try a different file or use JPEG/PNG."
      );
    }
  }

  function clearPoster() {
    setPosterFile(null);
    setPosterPreviewUrl("");
  }

  async function handleSubmit() {
    if (!valid || !videoFile) return;
    setSubmitting(true);
    setUploadPercent(0);
    try {
      const post = await uploadDiscoverPost({
        videoFile,
        posterFile: posterFile ?? undefined,
        caption: caption.trim() || undefined,
        cta:
          target === "product"
            ? { type: "product", productId }
            : { type: "shop", shopId: shop.id },
        intent: mode,
        onProgress: setUploadPercent,
      });
      // Once the upload finishes the bar flips to indeterminate while
      // backend uploads to Cloudinary + persists. Tells the user "still
      // working" without claiming false specificity.
      setUploadPercent(undefined);
      if (mode === "free") {
        // Free path: post is live in the organic mix immediately. Drop the
        // seller at the analytics page where they can boost later.
        toast.success(
          "Posted to Discover",
          "Live for 30 days. Boost it any time to surface to more buyers."
        );
        router.push(`/seller/ads/${post.id}`);
        return;
      }
      const { authorization_url } = await purchaseDiscoverCampaign({
        postId: post.id,
        planId,
      });
      // Hand off to Paystack — server resolves the campaign on its webhook
      // and the return URL drops the seller back at the analytics page.
      window.location.href = authorization_url;
    } catch (err) {
      const apiErr = extractApiError(err);
      // Dump everything we can about the failure so a 400 from backend
      // is debuggable from the browser console alone — no Render-log dive.
      const debug: Record<string, unknown> = { apiErr, mode };
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
      console.warn("[discover-post] failed", debug);
      if (apiErr?.code === "free_discover_limit") {
        toast.error(
          "Free post limit hit",
          "You can post 3 free Discover videos per month. Boost an existing post instead, or wait until your earliest free post expires.",
          apiErr.requestId
        );
      } else {
        toast.fromApiError("Couldn't create the post", err);
      }
      setSubmitting(false);
      setUploadPercent(undefined);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <UploadOverlay
        open={submitting}
        progress={uploadPercent}
        title={mode === "free" ? "Posting to Discover…" : "Uploading your ad…"}
        hint="Keep this tab open — we'll let you know when it's done."
      />
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
            "relative mx-auto aspect-9/16 w-44 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted sm:w-52",
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
                Vertical, 9–30s, under {formatBytes(MAX_VIDEO_BYTES)}
              </Typography>
            </button>
          )}
        </div>
        {videoFile && (
          <Typography variant="caption" className="text-muted-foreground">
            {formatBytes(videoFile.size)} · {videoFile.name}
          </Typography>
        )}
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
        <Typography variant="heading-h3">Launch it</Typography>
        <div className="grid grid-cols-2 gap-2">
          <ModeCard
            active={mode === "boost"}
            onClick={() => setMode("boost")}
            label="Pay to boost"
            hint="Priority slots in Discover for the full plan duration"
            recommended
          />
          <ModeCard
            active={mode === "free"}
            onClick={() => setMode("free")}
            label="Post for free"
            hint="30-day organic placement. Boost later if it picks up."
          />
        </div>

        {mode === "boost" ? (
          <>
            <BoostPlanList planId={planId} onSelect={setPlanId} />
            <Typography variant="caption" className="text-muted-foreground">
              Runs for {chosen.months}{" "}
              {chosen.months === 1 ? "month" : "months"}. Cancel anytime; no
              auto-renew.
            </Typography>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <Typography variant="body-sm" className="text-foreground">
              Free posts live for 30 days in the organic mix. You can boost
              this video later to push it into priority slots.
            </Typography>
            <Typography
              variant="caption"
              className="mt-1 text-muted-foreground"
            >
              Limit: 3 free Discover posts per shop per 30 days.
            </Typography>
          </div>
        )}
      </section>

      <Button
        onClick={handleSubmit}
        variant="cta"
        size="lg"
        disabled={!valid || submitting}
      >
        <ShieldCheck className="size-4" />
        {submittingLabel({ submitting, mode, chosen })}
      </Button>
    </div>
  );
}

function submittingLabel({
  submitting,
  mode,
  chosen,
}: {
  submitting: boolean;
  mode: Mode;
  chosen: { priceNaira: number };
}): string {
  if (submitting) {
    return mode === "free"
      ? "Posting…"
      : "Uploading & opening Paystack…";
  }
  return mode === "free"
    ? "Post to Discover"
    : `Pay ${formatNaira(chosen.priceNaira)} & launch`;
}

interface ModeCardProps {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  recommended?: boolean;
}

function ModeCard({
  active,
  onClick,
  label,
  hint,
  recommended,
}: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "relative flex flex-col gap-1 overflow-hidden rounded-2xl border-2 border-primary bg-primary/4 p-4 text-left"
          : "relative flex flex-col gap-1 overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
      }
    >
      {recommended && (
        <span className="absolute right-2 top-2 inline-flex shrink-0 items-center rounded-full bg-accent/15 px-2 py-0.5">
          <Typography
            variant="caption"
            className="text-[10px] font-semibold text-accent"
          >
            Recommended
          </Typography>
        </span>
      )}
      <Typography variant="label-lg" className={recommended ? "pr-24" : undefined}>
        {label}
      </Typography>
      <Typography variant="caption" className="text-muted-foreground">
        {hint}
      </Typography>
    </button>
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
          ? "flex flex-col gap-1 rounded-2xl border-2 border-primary bg-primary/4 p-4 text-left"
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
