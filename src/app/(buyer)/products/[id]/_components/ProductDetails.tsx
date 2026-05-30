"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PausedShopBanner } from "@/components/PausedShopBanner";
import { ShareButton } from "@/components/ShareButton";
import { Typography } from "@/components/Typography";
import { useIsSaved } from "@/hooks/useIsSaved";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { extractApiError } from "@/lib/api";
import { startConversation } from "@/lib/actions/conversations";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Product } from "@/types";
import { MobileStickyCTA } from "./MobileStickyCTA";

interface ProductDetailsProps {
  product: Product;
  /** Average rating, if any reviews exist. */
  rating?: number | null;
  reviewCount?: number;
}

export function ProductDetails({
  product,
  rating,
  reviewCount,
}: ProductDetailsProps) {
  const { id, name, price, category, description, shop } = product;
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const saved = useIsSaved(id);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);
  const [opening, setOpening] = useState(false);

  const paused = shop.isActive === false;
  // Hide the Message CTA when the signed-in user owns the shop — no point in
  // letting them message themselves (backend should also reject, but skipping
  // the render is cleaner UX).
  const isOwner = !!(user && shop.ownerId && user.id === shop.ownerId);

  async function handleChatClick() {
    if (paused || isOwner) return;
    if (!requireAuth("to message the shop")) return;
    if (!shop.ownerId) {
      toast.error("Couldn't open chat", "Seller info isn't available yet.");
      return;
    }
    setOpening(true);
    try {
      // Chat v1: pass the seller user id. Product becomes a per-message
      // context attached to the first message we send — see ChatThread for
      // where the ?ctx= query is consumed.
      const { conversationId } = await startConversation({
        sellerId: shop.ownerId,
        contextProductId: id,
      });
      router.push(`/inbox/${conversationId}?ctx=${id}`);
    } catch (err) {
      console.warn("[product-chat] failed", err);
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

  function handleSaveToggle() {
    const next = toggleWishlist(id);
    toast.success(next ? "Saved" : "Removed from saved");
  }

  return (
    <div className="flex flex-col gap-6">
      {paused && <PausedShopBanner shopName={shop.name} compact />}
      <Link
        href={`/shops/${shop.id}`}
        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"
          >
            <Typography variant="heading-h4">
              {shop.name.charAt(0)}
            </Typography>
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Typography variant="heading-h4">{shop.name}</Typography>
              {shop.verified && (
                <BadgeCheck className="size-4 text-primary" />
              )}
            </div>
            <Typography variant="caption" className="text-muted-foreground">
              {shop.handle}
            </Typography>
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>

      <div className="flex flex-col gap-3">
        <Typography variant="overline" className="text-muted-foreground">
          {category}
        </Typography>
        <Typography variant="heading-h1">{name}</Typography>
        <div className="flex flex-wrap items-baseline gap-3">
          <Typography variant="price-lg" className="text-primary">
            {formatNaira(price)}
          </Typography>
          {rating != null && reviewCount ? (
            <span className="inline-flex items-center gap-1 text-accent">
              <Star className="size-3.5 fill-current" />
              <Typography variant="label-sm" className="font-semibold">
                {rating.toFixed(1)}
              </Typography>
              <Typography variant="caption" className="text-muted-foreground">
                ({reviewCount})
              </Typography>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Typography variant="label-md">Description</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          {description}
        </Typography>
      </div>

      <div className="hidden flex-col gap-3 pt-2 md:flex">
        {isOwner ? null : paused ? (
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled
            title="This seller is paused and isn't taking new orders"
          >
            <MessageCircle className="size-4" />
            Chat unavailable while paused
          </Button>
        ) : (
          <Button
            onClick={handleChatClick}
            variant="cta"
            size="lg"
            className="w-full"
            disabled={opening}
          >
            {opening ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageCircle className="size-4" />
            )}
            {opening ? "Opening chat…" : "Message the shop"}
          </Button>
        )}
        <div className="flex gap-2">
          <Button
            onClick={handleSaveToggle}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <Bookmark
              className={cn("size-4", saved && "fill-primary text-primary")}
            />
            {saved ? "Saved" : "Save for later"}
          </Button>
          <ShareButton
            url={`/products/${id}`}
            title={name}
            text={`${name} — ${formatNaira(price)} on Ahia`}
            label="Share"
          />
        </div>
      </div>

      <EscrowNote />

      <MobileStickyCTA
        onChat={handleChatClick}
        onSave={handleSaveToggle}
        saved={saved}
        opening={opening}
        paused={paused}
        isOwner={isOwner}
        shareUrl={`/products/${id}`}
        shareTitle={name}
        shareText={`${name} — ${formatNaira(price)} on Ahia`}
      />
    </div>
  );
}

function EscrowNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        <ShieldCheck className="size-4" />
      </span>
      <div className="flex flex-col gap-1">
        <Typography variant="label-md" className="text-primary">
          Protected by Ahia escrow
        </Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Your money sits with Ahia until you tell us the package arrived. If
          it never does, you get a refund — not a screenshot of regret.{" "}
          <Link
            href="/help/escrow"
            className="font-medium text-primary hover:underline"
          >
            How it works
          </Link>
        </Typography>
      </div>
    </div>
  );
}
