import { getApi } from "@/lib/api";

interface StartConversationArgs {
  productId?: string;
  shopId?: string;
}

/**
 * Find-or-create a conversation for the current buyer.
 * Backend dedupes by `(buyer_id, product_id)` when productId is set, or by
 * `(buyer_id, shop_id)` when only shopId is set — same buyer tapping
 * "Chat with seller" twice on the same product returns the same id.
 *
 * Uses `getApi()` so it works from both server components (inbox deep-link
 * redirect) and client components (chat buttons). On a 403 from a paused or
 * tombstoned shop, the axios error survives — callers can match
 * `extractApiError(err)?.code === "shop_paused" | "shop_gone"` to render a
 * specific toast instead of a generic failure.
 */
export async function startConversation(
  args: StartConversationArgs
): Promise<{ conversationId: string }> {
  const api = await getApi();
  const { data } = await api.post<{ conversation: { id: string } }>(
    "/conversations",
    args
  );
  return { conversationId: data.conversation.id };
}
