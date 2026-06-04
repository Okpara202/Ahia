"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageCircle, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/PageLoader";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import { startConversation } from "@/lib/actions/conversations";
import { formatRelativeTime } from "@/lib/format";
import { getMyFollowers, type ShopFollower } from "@/lib/services/following";
import { toast } from "@/store/toastStore";

/**
 * Seller's "Followers" page. Lists users who follow the shop with a
 * Message button on each row. The button is dimmed (and the request is
 * pre-blocked) when the follower has `allowsColdDMs === false` — backend
 * still enforces this with `403 buyer_blocks_cold_dms`, but failing locally
 * is a better UX than letting the seller hit a wall.
 *
 * `GET /shops/me/followers` ships as part of Phase 7. Until then, the
 * service returns empty on 404 and this page falls into its empty state.
 */
export function FollowersListLoader() {
  const router = useRouter();
  const [items, setItems] = useState<ShopFollower[] | null>(null);
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyFollowers()
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

  async function handleMessage(follower: ShopFollower) {
    if (messagingUserId) return;
    if (!follower.allowsColdDMs) {
      toast.info(
        "This buyer hasn't opted in",
        "They'll need to message you first."
      );
      return;
    }
    setMessagingUserId(follower.userId);
    try {
      // Seller-initiated path: backend's POST /conversations { buyerId }.
      // Distinct from buyer-initiated (sellerId) — backend uses this to
      // enforce 50/day cold-DM limit + buyer's allowsColdDMs preference.
      const { conversationId } = await startConversation({
        buyerId: follower.userId,
      });
      router.push(`/seller/inbox/${conversationId}`);
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr?.code === "cold_dm_limit") {
        toast.error(
          "Daily message limit hit",
          "You can start 50 new conversations per day. Try again tomorrow."
        );
      } else if (apiErr?.code === "buyer_blocks_cold_dms") {
        toast.info(
          "This buyer hasn't opted in",
          "They'll need to message you first."
        );
      } else {
        toast.error(
          "Couldn't open chat",
          apiErr?.message ?? "Try again in a moment.",
          apiErr?.requestId
        );
      }
      setMessagingUserId(null);
    }
  }

  if (items === null) {
    return <PageLoader fullScreen={false} label="Loading followers…" />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col gap-1">
        <Typography variant="overline" className="text-primary">
          Your audience
        </Typography>
        <Typography variant="heading-h1">Followers</Typography>
        <Typography variant="body-md" className="text-muted-foreground">
          People who follow your shop. Message follow-ups, drops, or offers
          — within the daily cap.
        </Typography>
      </header>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((follower) => (
            <li key={follower.userId}>
              <Row
                follower={follower}
                onMessage={() => handleMessage(follower)}
                messaging={messagingUserId === follower.userId}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface RowProps {
  follower: ShopFollower;
  onMessage: () => void;
  messaging: boolean;
}

function Row({ follower, onMessage, messaging }: RowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted/40">
      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
        {follower.avatarUrl ? (
          <Image
            src={follower.avatarUrl}
            alt={follower.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <User className="size-5 text-muted-foreground" />
        )}
        {follower.isOnline && (
          <span
            aria-label="Online"
            className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-success"
          />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Typography variant="label-md" className="truncate">
          {follower.name}
        </Typography>
        <Typography
          variant="caption"
          className="truncate text-muted-foreground"
        >
          Followed {formatRelativeTime(follower.followedAt)}
        </Typography>
      </div>
      <Button
        type="button"
        variant={follower.allowsColdDMs ? "outline" : "ghost"}
        size="sm"
        onClick={onMessage}
        disabled={messaging || !follower.allowsColdDMs}
        title={
          follower.allowsColdDMs
            ? "Send a message"
            : "This buyer hasn't opted in to follow-up messages"
        }
      >
        <MessageCircle className="size-3.5" />
        {messaging ? "Opening…" : "Message"}
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <User className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <Typography variant="heading-h3">No followers yet</Typography>
        <Typography
          variant="body-sm"
          className="max-w-xs text-muted-foreground"
        >
          Buyers can follow your shop from your storefront. They&apos;ll
          show up here once they do.
        </Typography>
      </div>
    </div>
  );
}
