"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageCircle, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/PageLoader";
import { Typography } from "@/components/Typography";
import { startConversation } from "@/lib/actions/conversations";
import { getMyFollowing, type FollowingShop } from "@/lib/services/following";
import { toast } from "@/store/toastStore";

/**
 * Buyer's "Following" page. Renders the list of shops the user follows with
 * Message buttons. Backend ships `GET /me/following` as part of Phase 7;
 * until then the service returns empty on 404 and the page falls into its
 * empty state. Once backend lands, the same component starts displaying
 * real data without any other change.
 */
export function FollowingListLoader() {
  const router = useRouter();
  const [items, setItems] = useState<FollowingShop[] | null>(null);
  const [messagingShopId, setMessagingShopId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyFollowing()
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleMessage(shop: FollowingShop) {
    if (messagingShopId) return;
    setMessagingShopId(shop.shopId);
    try {
      const { conversationId } = await startConversation({
        sellerId: shop.sellerId,
      });
      router.push(`/inbox/${conversationId}`);
    } catch {
      toast.error(
        "Couldn't open chat",
        "Try again in a moment."
      );
      setMessagingShopId(null);
    }
  }

  if (items === null) {
    return <PageLoader fullScreen={false} label="Loading shops…" />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-1">
        <Typography variant="overline" className="text-primary">
          Your follows
        </Typography>
        <Typography variant="heading-h1">Following</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          Shops you follow. Open a chat any time.
        </Typography>
      </header>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((shop) => (
            <li key={shop.shopId}>
              <Row
                shop={shop}
                onMessage={() => handleMessage(shop)}
                messaging={messagingShopId === shop.shopId}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface RowProps {
  shop: FollowingShop;
  onMessage: () => void;
  messaging: boolean;
}

function Row({ shop, onMessage, messaging }: RowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted/40">
      <Link
        href={`/shops/${shop.shopId}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
          {shop.avatarUrl ? (
            <Image
              src={shop.avatarUrl}
              alt={shop.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <Store className="size-5 text-muted-foreground" />
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <Typography variant="label-md" className="truncate">
              {shop.name}
            </Typography>
            {shop.isOnline && <OnlinePill />}
          </div>
          <Typography
            variant="caption"
            className="truncate text-muted-foreground"
          >
            @{shop.handle}
          </Typography>
        </div>
      </Link>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onMessage}
        disabled={messaging}
      >
        <MessageCircle className="size-3.5" />
        {messaging ? "Opening…" : "Message"}
      </Button>
    </div>
  );
}

function OnlinePill() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-success/15 px-2 py-0.5 text-success">
      <Typography variant="caption" className="font-medium">
        Online
      </Typography>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Store className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <Typography variant="heading-h3">No shops yet</Typography>
        <Typography
          variant="body-sm"
          className="max-w-xs text-muted-foreground"
        >
          Follow shops from their storefront — they&apos;ll show up here for
          quick access.
        </Typography>
      </div>
      <Button asChild variant="cta" size="default">
        <Link href="/feed">Browse the feed</Link>
      </Button>
    </div>
  );
}
