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
}

export async function sendTextMessage(
  conversationId: string,
  content: string,
  opts: SendOptions = {}
): Promise<Message> {
  const { data } = await apiClient().post<{ message: unknown }>(
    `/conversations/${conversationId}/messages`,
    { content, contextProductId: opts.contextProductId }
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
