"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  X,
} from "lucide-react";

import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { useIsSaved } from "@/hooks/useIsSaved";
import { extractApiError } from "@/lib/api";
import { startConversation } from "@/lib/actions/conversations";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Media, Product } from "@/types";

interface QuickViewSheetProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickViewSheet({ product, onClose }: QuickViewSheetProps) {
  const router = useRouter();
  const productId = product?.id ?? "";
  const saved = useIsSaved(productId);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);
  const [opening, setOpening] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const open = product !== null;

  // Hide Message CTA on own products — owner can't message themselves.
  const isOwner = !!(
    user &&
    product?.shop?.ownerId &&
    user.id === product.shop.ownerId
  );

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      // Reset carousel + opening flag whenever a new product is shown — so
      // navigating between cards always starts on the cover, not wherever
      // the previous product was paused.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpening(false);
      setImageIndex(0);
    }
  }, [open, product?.id]);

  if (!product) return null;

  const { id, name, price, media, gallery, shop, description, sponsored } =
    product;
  const items: Media[] = [media, ...(gallery ?? [])].filter(
    (m) => (m.type === "image" ? m.url : m.poster) !== ""
  );

  async function handleChat() {
    if (isOwner) return;
    if (!shop.ownerId) {
      toast.error("Couldn't open chat", "Seller info isn't available yet.");
      return;
    }
    setOpening(true);
    try {
      // Chat v1: dedupe by (buyer, seller); product becomes a per-message
      // context attached to the buyer's first message. Backend treats
      // contextProductId on POST /conversations as a hint only — the
      // first actual message we send needs to carry it.
      const { conversationId } = await startConversation({
        sellerId: shop.ownerId,
        contextProductId: id,
      });
      router.push(`/inbox/${conversationId}?ctx=${id}`);
    } catch (err) {
      console.warn("[quick-view-chat] failed", err);
      const code = extractApiError(err)?.code;
      if (code === "shop_paused" || code === "shop_gone") {
        toast.error(
          "This seller is on a break",
          "Follow them to know when they reopen."
        );
      } else if (code === "self_conversation") {
        toast.error("That's your own shop", "You can't message yourself.");
      } else {
        toast.error("Couldn't open chat", "Try again in a moment.");
      }
      setOpening(false);
    }
  }

  function handleSave() {
    const next = toggleWishlist(productId);
    toast.success(next ? "Saved" : "Removed from saved");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close quick view"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl animate-in slide-in-from-bottom duration-300 sm:rounded-3xl sm:slide-in-from-bottom-4 sm:fade-in">
        <QuickViewCarousel
          items={items}
          index={imageIndex}
          onIndex={setImageIndex}
          name={name}
          sponsored={sponsored}
          onClose={onClose}
        />

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          <div className="flex items-baseline justify-between gap-3">
            <Typography variant="heading-h2" className="flex-1">
              {name}
            </Typography>
            <Typography variant="price-lg" className="text-primary">
              {formatNaira(price)}
            </Typography>
          </div>

          <Link
            href={`/shops/${shop.id}`}
            className="flex items-center gap-2.5 rounded-xl border border-border p-2.5 transition-colors hover:border-primary/40"
          >
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary"
            >
              <Typography variant="label-sm" className="font-bold">
                {shop.name.charAt(0)}
              </Typography>
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <Typography variant="label-md" className="truncate">
                {shop.name}
              </Typography>
              {shop.verified && (
                <BadgeCheck className="size-3.5 shrink-0 text-primary" />
              )}
            </div>
            <Typography variant="caption" className="text-muted-foreground">
              View shop
            </Typography>
          </Link>

          {description && (
            <Typography
              variant="body-sm"
              className="line-clamp-3 text-muted-foreground"
            >
              {description}
            </Typography>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleSave}
              variant="outline"
              size="lg"
              aria-label={saved ? "Saved" : "Save"}
              className="shrink-0 px-3"
            >
              <Bookmark
                className={cn("size-5", saved && "fill-primary text-primary")}
              />
            </Button>
            <ShareButton
              url={`/products/${id}`}
              title={name}
              text={`${name} — ${formatNaira(price)} on Ahia`}
            />
            {!isOwner && (
              <Button
                type="button"
                onClick={handleChat}
                variant="cta"
                size="lg"
                disabled={opening}
                className="flex-1"
              >
                {opening ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MessageCircle className="size-4" />
                )}
                {opening ? "Opening chat…" : "Message the shop"}
              </Button>
            )}
          </div>

          <Link
            href={`/products/${id}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 self-center text-primary hover:underline"
          >
            <Typography variant="label-sm">View full details</Typography>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface QuickViewCarouselProps {
  items: Media[];
  index: number;
  onIndex: (next: number) => void;
  name: string;
  sponsored?: boolean;
  onClose: () => void;
}

/** Image carousel inside the QuickView sheet. Cover + gallery share the same
 *  hero slot — buyer can flip through everything without leaving /feed.
 *  Mirrors the index pattern in `ProductMedia` so behavior stays consistent
 *  with the full product detail page. */
function QuickViewCarousel({
  items,
  index,
  onIndex,
  name,
  sponsored,
  onClose,
}: QuickViewCarouselProps) {
  const current = items[index] ?? items[0];
  const heroUrl = current
    ? current.type === "image"
      ? current.url
      : current.poster ?? ""
    : "";
  const hasMultiple = items.length > 1;

  function go(delta: number) {
    if (!hasMultiple) return;
    const next = (index + delta + items.length) % items.length;
    onIndex(next);
  }

  return (
    <div className="group relative aspect-square w-full overflow-hidden bg-muted">
      {heroUrl && (
        <Image
          key={heroUrl}
          src={heroUrl}
          alt={name}
          fill
          sizes="(min-width: 640px) 28rem, 100vw"
          className="object-cover"
        />
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-background"
      >
        <X className="size-4" />
      </button>

      {sponsored && (
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-card/85 px-2 py-0.5 text-muted-foreground backdrop-blur">
          <Typography variant="label-sm">Promoted</Typography>
        </span>
      )}

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-background"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-background"
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {items.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index
                    ? "w-5 bg-background"
                    : "w-1.5 bg-background/60"
                )}
              />
            ))}
          </div>
          <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center rounded-full bg-foreground/65 px-2 py-0.5 text-background backdrop-blur">
            <Typography variant="label-sm">
              {index + 1} / {items.length}
            </Typography>
          </span>
        </>
      )}
    </div>
  );
}
