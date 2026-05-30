"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { extractApiError } from "@/lib/api";
import { startConversation } from "@/lib/actions/conversations";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

interface ChatWithShopButtonProps {
  shopId: string;
  /** Owner of the shop. When provided and it matches the signed-in user, the
   *  button is hidden entirely — you can't chat with yourself. Backend will
   *  also reject self-conversations (queued ask), but skipping the render is
   *  the right UX regardless. */
  ownerId?: string;
  /** When true, the button is rendered as disabled with paused-state copy.
   *  Backend will also reject `POST /conversations` with `403 shop_paused`,
   *  but disabling client-side avoids the round-trip + error toast. */
  paused?: boolean;
}

export function ChatWithShopButton({
  shopId,
  ownerId,
  paused,
}: ChatWithShopButtonProps) {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const [opening, setOpening] = useState(false);

  // Don't render the button on your own shop — same convention as FollowButton.
  if (user && ownerId && user.id === ownerId) return null;

  async function handleClick() {
    if (paused) return;
    if (!requireAuth("to chat with this shop")) return;
    setOpening(true);
    try {
      const { conversationId } = await startConversation({ shopId });
      router.push(`/inbox/${conversationId}`);
    } catch (err) {
      console.warn("[chat-with-shop] failed", err);
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

  if (paused) {
    return (
      <Button
        variant="outline"
        size="lg"
        disabled
        title="This seller is paused and isn't taking new chats"
      >
        <MessageCircle className="size-4" />
        Chat unavailable
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant="cta"
      size="lg"
      disabled={opening}
    >
      {opening ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <MessageCircle className="size-4" />
      )}
      {opening ? "Opening chat…" : "Chat with seller"}
    </Button>
  );
}
