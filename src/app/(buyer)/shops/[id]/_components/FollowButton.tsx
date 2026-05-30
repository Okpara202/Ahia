"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { extractApiError } from "@/lib/api";
import { followShop, unfollowShop } from "@/lib/services/shops";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

interface FollowButtonProps {
  shopId: string;
  ownerId?: string;
  initialFollowing: boolean;
}

/**
 * Follow / unfollow a shop. Optimistic — flips state immediately, reverts
 * on error. Hidden for the shop owner (you can't follow yourself).
 *
 * Backend contract:
 *  - `POST /shops/:id/follow`   idempotent, 204
 *  - `DELETE /shops/:id/follow` idempotent, 204
 *  - `GET /shops/:id` returns `isFollowing: boolean` when the request is
 *    authenticated; undefined for guests.
 */
export function FollowButton({
  shopId,
  ownerId,
  initialFollowing,
}: FollowButtonProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [following, setFollowing] = useState(initialFollowing);
  const [working, setWorking] = useState(false);

  // Don't render the button on your own shop.
  if (user && ownerId && user.id === ownerId) return null;

  async function handleClick() {
    if (working) return;
    if (!user) {
      // Send guests to login with a return path so they land back here.
      router.push(`/login?next=/shops/${shopId}`);
      return;
    }
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setWorking(true);
    try {
      if (wasFollowing) {
        await unfollowShop(shopId);
      } else {
        await followShop(shopId);
        toast.success("Following", "You'll see updates from this shop.");
      }
    } catch (err) {
      // Revert on failure.
      setFollowing(wasFollowing);
      toast.error(
        wasFollowing ? "Couldn't unfollow" : "Couldn't follow",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <Button
      type="button"
      variant={following ? "outline" : "cta"}
      size="lg"
      onClick={handleClick}
      disabled={working}
    >
      {working ? (
        <Loader2 className="size-4 animate-spin" />
      ) : following ? (
        <Check className="size-4" />
      ) : (
        <Heart className="size-4" />
      )}
      {following ? "Following" : "Follow shop"}
    </Button>
  );
}
