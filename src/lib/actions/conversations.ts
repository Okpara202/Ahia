import { getApi } from "@/lib/api";
import { mapConversationDetail } from "@/lib/services/conversations";
import type { ConversationDetail } from "@/types";

interface StartConversationArgs {
  /** User id of the seller. Required — Chat v1 dedupes by (buyer, seller). */
  sellerId: string;
  /** Optional WhatsApp-reply-style product context. Frontend MUST attach
   *  this to the first text message it sends — backend treats it as a hint
   *  only on POST /conversations (per their reply, §14.1). */
  contextProductId?: string;
}

/**
 * Find-or-create a (buyer, seller) conversation.
 *
 * Backend dedupes by (buyer, seller) — see CHAT_V1_BACKEND_SPEC §4.1.
 * Same buyer messaging the same seller from any product/shop entry point
 * returns the same conversation id.
 *
 * Returns the full conversation detail (same shape as GET /conversations/:id)
 * so callers can hydrate the chat page state without an extra round-trip.
 *
 * On `403 shop_paused` / `403 shop_gone` / `400 self_conversation`, the axios
 * error propagates — callers can match `extractApiError(err)?.code` to render
 * a specific toast.
 */
export async function startConversation(
  args: StartConversationArgs
): Promise<{ conversationId: string; conversation: ConversationDetail }> {
  const api = await getApi();
  const { data } = await api.post<{ conversation: unknown }>("/conversations", {
    sellerId: args.sellerId,
    contextProductId: args.contextProductId,
  });
  const conversation = mapConversationDetail(data.conversation);
  return { conversationId: conversation.id, conversation };
}
