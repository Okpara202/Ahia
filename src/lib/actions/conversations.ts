import { getApi } from "@/lib/api";
import { mapConversationDetail } from "@/lib/services/conversations";
import type { ConversationDetail } from "@/types";

interface BuyerInitiatedArgs {
  /** User id of the seller. Buyer-initiated path. */
  sellerId: string;
  /** Optional WhatsApp-reply-style product context. Frontend MUST attach
   *  this to the first text message it sends — backend treats it as a hint
   *  only on POST /conversations (per their reply, §14.1). */
  contextProductId?: string;
  buyerId?: never;
}

interface SellerInitiatedArgs {
  /** User id of the buyer. Seller-initiated path (cold-DM from
   *  /seller/followers). Backend enforces:
   *  - 403 not_seller if caller has no active shop
   *  - 403 buyer_blocks_cold_dms if target opted out
   *  - 429 cold_dm_limit if seller exceeded 50 fresh convos in 24h */
  buyerId: string;
  sellerId?: never;
  contextProductId?: never;
}

type StartConversationArgs = BuyerInitiatedArgs | SellerInitiatedArgs;

/**
 * Find-or-create a conversation. Backend dedupes by (buyer, seller) — the
 * same pair always lands in the same thread regardless of who initiated.
 *
 * Two paths:
 *  - Buyer-initiated: pass `sellerId`. Used by all "Chat with seller" CTAs
 *    on products / shops / discover.
 *  - Seller-initiated: pass `buyerId`. Used by the cold-DM Message button
 *    on /seller/followers. Backend enforces follower-list-only + cold-DM
 *    rate limits.
 *
 * Returns the full conversation detail (same shape as GET /conversations/:id)
 * so callers can hydrate the chat page state without an extra round-trip.
 */
export async function startConversation(
  args: StartConversationArgs
): Promise<{ conversationId: string; conversation: ConversationDetail }> {
  const api = await getApi();
  const body =
    args.sellerId !== undefined
      ? { sellerId: args.sellerId, contextProductId: args.contextProductId }
      : { buyerId: args.buyerId };
  const { data } = await api.post<{ conversation: unknown }>(
    "/conversations",
    body
  );
  const conversation = mapConversationDetail(data.conversation);
  return { conversationId: conversation.id, conversation };
}
