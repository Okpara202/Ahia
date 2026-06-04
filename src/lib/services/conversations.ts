import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
import type {
  ChatShop,
  ChatUser,
  ConversationDetail,
  ConversationListItem,
  Invoice,
  InvoiceLine,
  InvoiceLineKind,
  InvoiceLineStatus,
  InvoiceStatus,
  Message,
  MessageContextProduct,
  MessageReaction,
  MessageType,
  StoryContext,
} from "@/types";

/* -------------------------------------------------------------------------- */
/*  Tiny coercion helpers                                                     */
/* -------------------------------------------------------------------------- */

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNullableString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/* -------------------------------------------------------------------------- */
/*  Mappers                                                                   */
/* -------------------------------------------------------------------------- */

function mapChatUser(raw: unknown): ChatUser {
  const r = asObject(raw);
  return {
    id: asString(r.id),
    name: asString(r.name, "Unknown"),
    avatarUrl: asNullableString(r.avatarUrl),
  };
}

function mapChatShop(raw: unknown): ChatShop {
  const r = asObject(raw);
  return {
    id: asString(r.id),
    name: asString(r.name, ""),
    handle: asString(r.handle, ""),
    avatarUrl: asNullableString(r.avatarUrl),
    isActive: asBool(r.isActive, true),
  };
}

function mapContextProduct(raw: unknown): MessageContextProduct | null {
  if (raw === null || raw === undefined) return null;
  const r = asObject(raw);
  if (!r.id) return null;
  return {
    id: asString(r.id),
    name: asString(r.name),
    price: asString(r.price, "0"),
    coverUrl: asString(r.coverUrl),
  };
}

function mapStoryContext(raw: unknown): StoryContext | null {
  if (raw === null || raw === undefined) return null;
  const r = asObject(raw);
  if (!r.storyId || !r.mediaUrl) return null;
  const rawType = asString(r.mediaType, "image");
  return {
    storyId: asString(r.storyId),
    mediaUrl: asString(r.mediaUrl),
    mediaType: rawType === "video" ? "video" : "image",
    posterUrl:
      typeof r.posterUrl === "string" && r.posterUrl.length > 0
        ? r.posterUrl
        : undefined,
    caption:
      typeof r.caption === "string" && r.caption.length > 0
        ? r.caption
        : undefined,
  };
}

function mapReactions(raw: unknown): MessageReaction[] {
  return asArray(raw)
    .map((item) => {
      const r = asObject(item);
      const userId = asString(r.userId);
      const emoji = asString(r.emoji);
      if (!userId || !emoji) return null;
      return { userId, emoji };
    })
    .filter((r): r is MessageReaction => r !== null);
}

function mapInvoiceLine(raw: unknown): InvoiceLine {
  const r = asObject(raw);
  const kind = (asString(r.kind, "product") as InvoiceLineKind);
  const status = (asString(r.status, "pending") as InvoiceLineStatus);
  return {
    id: asString(r.id),
    kind,
    productId: asNullableString(r.productId),
    name: asString(r.name),
    quantity: asNumber(r.quantity, 1),
    unitPrice: asString(r.unitPrice, "0"),
    status,
    position: asNumber(r.position, 0),
    resolvedAt: asNullableString(r.resolvedAt),
    autoReleaseAt: asNullableString(r.autoReleaseAt),
    extendedAt: asNullableString(r.extendedAt),
    extensionReason: asNullableString(r.extensionReason),
  };
}

export function mapInvoice(raw: unknown): Invoice {
  const r = asObject(raw);
  return {
    id: asString(r.id),
    status: asString(r.status, "pending") as InvoiceStatus,
    totalAmount: asString(r.totalAmount, "0"),
    paystackRef: asNullableString(r.paystackRef),
    createdAt: asString(r.createdAt, new Date(0).toISOString()),
    paidAt: asNullableString(r.paidAt),
    cancelledAt: asNullableString(r.cancelledAt),
    lines: asArray(r.lines).map(mapInvoiceLine),
  };
}

/**
 * Maps the backend's message envelope into our discriminated Message union.
 * Backend's payload shape per CHAT_V1_BACKEND_SPEC §2.3 and §3.
 */
export function mapMessage(raw: unknown): Message {
  const r = asObject(raw);
  const type = asString(r.type, "text") as MessageType;
  const base = {
    id: asString(r.id),
    conversationId: asString(r.conversationId),
    senderId: asString(r.senderId),
    createdAt: asString(r.createdAt, new Date(0).toISOString()),
    editedAt: asNullableString(r.editedAt),
    deliveredAt: asNullableString(r.deliveredAt),
    readAt: asNullableString(r.readAt),
    reactions: mapReactions(r.reactions),
    contextProduct: mapContextProduct(r.contextProduct),
    storyContext: mapStoryContext(r.storyContext),
  };

  switch (type) {
    case "voice":
      return {
        ...base,
        type: "voice",
        voiceUrl: asString(r.voiceUrl),
        voiceDurationMs: asNumber(r.voiceDurationMs),
        content: null,
      };
    case "image":
      return {
        ...base,
        type: "image",
        imageUrl: asString(r.imageUrl),
        content: asNullableString(r.content),
      };
    case "invoice":
      return {
        ...base,
        type: "invoice",
        invoice: mapInvoice(r.invoice),
        content: null,
      };
    case "system":
      return { ...base, type: "system", content: asString(r.content) };
    case "text":
    default:
      return { ...base, type: "text", content: asString(r.content) };
  }
}

export function mapConversationDetail(raw: unknown): ConversationDetail {
  const r = asObject(raw);
  return {
    id: asString(r.id),
    buyer: mapChatUser(r.buyer),
    seller: mapChatUser(r.seller),
    shop: mapChatShop(r.shop),
    createdAt: asString(r.createdAt, new Date(0).toISOString()),
    lastActivityAt: asString(r.lastActivityAt, new Date(0).toISOString()),
  };
}

/** Back-compat alias for code that still imports `mapConversation`. New code
 *  should call `mapConversationDetail` to be explicit. */
export const mapConversation = mapConversationDetail;

function mapListSnippet(raw: unknown): ConversationListItem["lastMessage"] {
  if (raw === null || raw === undefined) return null;
  const r = asObject(raw);
  if (!r.id) return null;
  return {
    id: asString(r.id),
    type: asString(r.type, "text") as MessageType,
    snippet: asString(r.snippet),
    senderId: asString(r.senderId),
    createdAt: asString(r.createdAt, new Date(0).toISOString()),
  };
}

export function mapConversationListItem(raw: unknown): ConversationListItem {
  const r = asObject(raw);
  return {
    id: asString(r.id),
    counterparty: mapChatUser(r.counterparty),
    shop: mapChatShop(r.shop),
    lastMessage: mapListSnippet(r.lastMessage),
    lastActivityAt: asString(r.lastActivityAt, new Date(0).toISOString()),
    unreadCount: asNumber(r.unreadCount),
  };
}

/* -------------------------------------------------------------------------- */
/*  Conversation reads                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Inbox list. Server-rendered snippets + per-counterparty unread counts.
 * Cache-busted because Edge's cross-origin HTTP cache for credentialed
 * requests sometimes serves a stale 304 with no body — see ChatThreadLoader
 * for the full context (CLAUDE.md §11c Brave/cross-origin section).
 */
export async function getConversations(): Promise<ConversationListItem[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ items?: unknown[] }>("/conversations", {
      params: { _t: Date.now() },
      validateStatus: (s) => s >= 200 && s < 400,
    });
    return asArray(data?.items).map(mapConversationListItem);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return [];
    throw err;
  }
}

export interface ConversationThreadPayload {
  conversation: ConversationDetail;
  messages: Message[];
}

export async function getConversation(
  id: string
): Promise<ConversationThreadPayload | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      conversation: unknown;
      messages: unknown[];
    }>(`/conversations/${id}`, {
      params: { _t: Date.now() },
      validateStatus: (s) => s >= 200 && s < 400,
    });
    if (!data?.conversation) return null;
    return {
      conversation: mapConversationDetail(data.conversation),
      messages: asArray(data.messages).map(mapMessage),
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*  Message writes                                                            */
/* -------------------------------------------------------------------------- */

interface SendOptions {
  /** WhatsApp-reply-style product attachment. Backend snapshots the product
   *  and embeds the {id, name, price, coverUrl} on the message. */
  contextProductId?: string;
  /** "Reply to story" attachment. Backend snapshots the story's media URL,
   *  type, poster, and caption onto the message row so the preview
   *  survives story expiration. Only send the id — backend resolves the
   *  rest server-side. */
  storyId?: string;
}

export async function sendTextMessage(
  conversationId: string,
  content: string,
  opts: SendOptions = {}
): Promise<Message> {
  const { data } = await apiClient().post<{ message: unknown }>(
    `/conversations/${conversationId}/messages`,
    {
      content,
      contextProductId: opts.contextProductId,
      storyId: opts.storyId,
    }
  );
  return mapMessage(data.message);
}

export async function sendImageMessage(
  conversationId: string,
  file: File,
  caption?: string,
  opts: SendOptions = {}
): Promise<Message> {
  const fd = new FormData();
  fd.append("image_file", file);
  if (caption) fd.append("caption", caption);
  if (opts.contextProductId) fd.append("contextProductId", opts.contextProductId);
  const { data } = await apiClient().post<{ message: unknown }>(
    `/conversations/${conversationId}/messages/image`,
    fd
  );
  return mapMessage(data.message);
}

/** Voice messages: opus/webm or mp3 multipart upload. Backend stores in
 *  Cloudinary as resource_type=video; returned URL plays directly in
 *  <audio> tags. Backend enforces 3-min hard cap on durationMs and 6MB
 *  on body size. */
export async function sendVoiceMessage(
  conversationId: string,
  file: File,
  durationMs: number,
  opts: SendOptions = {}
): Promise<Message> {
  const fd = new FormData();
  fd.append("audio_file", file);
  fd.append("durationMs", String(durationMs));
  if (opts.contextProductId) fd.append("contextProductId", opts.contextProductId);
  const { data } = await apiClient().post<{ message: unknown }>(
    `/conversations/${conversationId}/messages/voice`,
    fd
  );
  return mapMessage(data.message);
}

/** Edit a text message within 15 minutes of send. Backend rejects with
 *  edit_window_expired / not_text / not_sender otherwise. */
export async function editTextMessage(
  conversationId: string,
  messageId: string,
  content: string
): Promise<Message> {
  const { data } = await apiClient().patch<{ message: unknown }>(
    `/conversations/${conversationId}/messages/${messageId}`,
    { content }
  );
  return mapMessage(data.message);
}

/** Toggle a reaction on a message — add, replace, or remove based on the
 *  user's existing reaction for that message. Backend returns the full
 *  reactions array post-toggle. */
export async function toggleReaction(
  conversationId: string,
  messageId: string,
  emoji: string
): Promise<MessageReaction[]> {
  const { data } = await apiClient().post<{ reactions: unknown }>(
    `/conversations/${conversationId}/messages/${messageId}/reactions`,
    { emoji }
  );
  return mapReactions(data.reactions);
}

/** Mark all messages from the counterparty in this conversation up to and
 *  including `throughMessageId` as read. Throttle to ~1.5s on the caller. */
export async function markConversationRead(
  conversationId: string,
  throughMessageId: string
): Promise<{ count: number; readAt: string }> {
  const { data } = await apiClient().post<{ count: number; readAt: string }>(
    `/conversations/${conversationId}/read`,
    { throughMessageId }
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Invoices                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Discriminated union — what the seller composer sends per line.
 *
 * For `product` lines, `unitPrice` and `name` are optional overrides — when
 * present, backend uses them on the invoice line; when absent, backend
 * snapshots from the products table at send time. Sellers haggle in chat
 * and the final agreed price often differs from the card; the override lets
 * the invoice reflect what was actually agreed.
 *
 * NOTE: Until backend ships override support (see
 * FRONTEND_ASK_invoice_line_price_override.md, 2026-05-31), `unitPrice` and
 * `name` on product lines are silently stripped by their Zod schema — the
 * invoice will use the listed product price regardless. Sending them is
 * safe; they just don't take effect yet.
 */
export type InvoiceLineDraft =
  | {
      kind: "product";
      productId: string;
      quantity: number;
      /** Optional override — defaults to the product's listed price when omitted. */
      unitPrice?: number;
      /** Optional override — defaults to the product's name when omitted. */
      name?: string;
    }
  | {
      kind: "custom";
      name: string;
      unitPrice: number;
      quantity: number;
    }
  | {
      kind: "discount";
      name: string;
      /** Negative integer/decimal — discount is subtracted from the total. */
      unitPrice: number;
      quantity?: number;
    };

/**
 * Send an invoice as a chat message. Seller-only. Backend creates the
 * invoice row, the lines, and the message envelope in one transaction and
 * emits both `message:new` and `invoice:created` to the buyer.
 *
 * Canonical URL is `POST /conversations/:id/invoices` (confirmed by backend
 * 2026-05-30; the older `/messages/invoice` URL still works as an alias).
 */
export async function sendInvoiceMessage(
  conversationId: string,
  lines: InvoiceLineDraft[]
): Promise<Message> {
  const { data } = await apiClient().post<{ message: unknown }>(
    `/conversations/${conversationId}/invoices`,
    { lines }
  );
  return mapMessage(data.message);
}

/** Seller cancels an unpaid invoice. Returns the updated invoice. */
export async function cancelInvoice(invoiceId: string): Promise<Invoice> {
  const { data } = await apiClient().post<{ invoice: unknown }>(
    `/invoices/${invoiceId}/cancel`
  );
  return mapInvoice(data.invoice);
}

/** Buyer pays an invoice. Returns Paystack init payload — we redirect to
 *  `authorizationUrl`. Payment confirmation happens via Paystack webhook +
 *  `invoice:paid` socket event. */
export async function payInvoice(
  invoiceId: string,
  callbackUrl?: string
): Promise<{ authorizationUrl: string; reference: string }> {
  const { data } = await apiClient().post<{
    authorizationUrl: string;
    reference: string;
  }>(
    `/invoices/${invoiceId}/pay`,
    callbackUrl ? { callbackUrl } : {}
  );
  return data;
}

/**
 * Buyer confirms delivery (releases escrow) for a single line. Backend
 * returns the line with the updated invoice nested inside it, so we can
 * refresh local state from a single response.
 *
 * "Confirm" is the buyer-facing verb; "release" is the money-side effect.
 * Backend accepts both `/invoice-lines/:id/confirm` (canonical) and
 * `.../release` (alias) — using `confirm` to match the UX label.
 */
export async function confirmInvoiceLine(
  lineId: string
): Promise<{ line: InvoiceLine; invoice: Invoice }> {
  const { data } = await apiClient().post<{ line: unknown }>(
    `/invoice-lines/${lineId}/confirm`
  );
  const lineRaw = asObject(data.line);
  return {
    line: mapInvoiceLine(lineRaw),
    invoice: mapInvoice(lineRaw.invoice),
  };
}

/**
 * Buyer disputes a single line. Multipart so optional evidence rides along.
 * Evidence should already be compressed by the caller via
 * `compressImageIfNeeded`.
 *
 * Important: backend does NOT change the invoice status when a single line
 * is disputed — only that line's `autoReleaseAt` is cleared. Other lines on
 * the invoice keep their auto-release timers and can still be confirmed
 * independently. Frontend detects a "disputed" line via
 * `status === 'pending' && autoReleaseAt === null`.
 */
export async function disputeInvoiceLine(
  lineId: string,
  args: { reason: string; evidence?: File }
): Promise<{ line: InvoiceLine; dispute: { id: string; reason: string } }> {
  let body: FormData | Record<string, string>;
  if (args.evidence) {
    const fd = new FormData();
    fd.append("reason", args.reason);
    fd.append("evidence_file", args.evidence);
    body = fd;
  } else {
    body = { reason: args.reason };
  }
  const { data } = await apiClient().post<{
    line: unknown;
    dispute: unknown;
  }>(`/invoice-lines/${lineId}/dispute`, body);
  const dispute = asObject(data.dispute);
  return {
    line: mapInvoiceLine(data.line),
    dispute: {
      id: asString(dispute.id),
      reason: asString(dispute.reason),
    },
  };
}

/**
 * Buyer extends their review window on a single line by +7 days. One
 * extension max per line — backend rejects subsequent attempts with
 * `already_extended`. Reason is required (3–200 chars after trim) and
 * surfaces on the seller's line badge.
 *
 * See FRONTEND_ASK_extend.md for the full spec and rationale.
 */
export async function extendInvoiceLine(
  lineId: string,
  reason: string
): Promise<InvoiceLine> {
  const { data } = await apiClient().post<{ line: unknown }>(
    `/invoice-lines/${lineId}/extend`,
    { reason }
  );
  return mapInvoiceLine(data.line);
}

export interface MessageSearchMatch {
  messageId: string;
  snippet: string;
  createdAt: string;
}

export async function searchMessages(
  conversationId: string,
  query: string
): Promise<MessageSearchMatch[]> {
  if (!query.trim()) return [];
  const { data } = await apiClient().get<{ matches: unknown[] }>(
    `/conversations/${conversationId}/messages/search`,
    { params: { q: query } }
  );
  return asArray(data.matches)
    .map((item) => {
      const r = asObject(item);
      return {
        messageId: asString(r.messageId),
        snippet: asString(r.snippet),
        createdAt: asString(r.createdAt),
      };
    })
    .filter((m) => m.messageId);
}
