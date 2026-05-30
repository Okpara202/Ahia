import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
import type {
  Conversation,
  ConversationParty,
  Media,
  Message,
} from "@/types";

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function mapParty(raw: unknown): ConversationParty {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    handle: String(r.handle ?? ""),
    verified: Boolean(r.verified ?? false),
  };
}

export function mapConversation(raw: unknown): Conversation {
  const r = raw as Record<string, unknown>;
  const product = (r.product ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id),
    buyer: mapParty(r.buyer),
    seller: mapParty(r.seller),
    product: {
      id: String(product.id ?? ""),
      name: String(product.name ?? ""),
      price: toNumber(product.price),
      media: product.media as Media,
    },
    lastMessage: String(r.lastMessage ?? ""),
    lastMessageAt: String(r.lastMessageAt ?? new Date().toISOString()),
    unread: Boolean(r.unread ?? false),
  };
}

export function mapMessage(raw: unknown): Message {
  const r = raw as Record<string, unknown>;
  const base = {
    id: String(r.id),
    conversationId: String(r.conversationId ?? ""),
    senderId: String(r.senderId ?? ""),
    createdAt: String(r.createdAt ?? new Date().toISOString()),
  };
  const type = r.type as Message["type"];
  switch (type) {
    case "payment_request":
      return {
        ...base,
        type: "payment_request",
        amount: toNumber(r.amount),
        status: (r.status as "pending" | "paid" | "cancelled") ?? "pending",
        note: r.note as string | undefined,
      };
    case "offer":
      return {
        ...base,
        type: "offer",
        amount: toNumber(r.amount),
        status:
          (r.status as "pending" | "accepted" | "declined" | "countered") ??
          "pending",
        note: r.note as string | undefined,
      };
    case "image":
      return {
        ...base,
        type: "image",
        url: String(r.url ?? ""),
        alt: r.alt as string | undefined,
        caption: r.caption as string | undefined,
      };
    case "system":
      return { ...base, type: "system", content: String(r.content ?? "") };
    case "text":
    default:
      return { ...base, type: "text", content: String(r.content ?? "") };
  }
}

export async function getConversations(): Promise<Conversation[]> {
  const api = await getApi();
  try {
    // Cache-bust + 304-tolerant — Edge's HTTP cache for cross-origin XHR with
    // credentials is unreliable, and our backend serves ETag-based 304s that
    // come back with no body. See ChatThreadLoader for the full context.
    // Server-side calls also pass this option harmlessly (no browser cache).
    const { data } = await api.get<{
      items?: unknown[];
      conversations?: unknown[];
    }>("/conversations", {
      params: { _t: Date.now() },
      validateStatus: (s) => s >= 200 && s < 400,
    });
    return ((data?.items ?? data?.conversations) ?? []).map(mapConversation);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return [];
    throw err;
  }
}

export async function getConversation(
  id: string
): Promise<{ conversation: Conversation; messages: Message[] } | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      conversation: unknown;
      messages: unknown[];
    }>(`/conversations/${id}`);
    return {
      conversation: mapConversation(data.conversation),
      messages: (data.messages ?? []).map(mapMessage),
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function sendTextMessage(
  conversationId: string,
  content: string
): Promise<Message> {
  const api = await getApi();
  const { data } = await api.post<{ message: unknown }>(
    `/conversations/${conversationId}/messages`,
    { content }
  );
  return mapMessage(data.message);
}

export async function sendOffer(
  conversationId: string,
  amount: number,
  note?: string
): Promise<Message> {
  const api = await getApi();
  const { data } = await api.post<{ message: unknown }>(
    `/conversations/${conversationId}/offer`,
    { amount, note }
  );
  return mapMessage(data.message);
}

export async function respondToOffer(
  conversationId: string,
  messageId: string,
  status: "accepted" | "declined"
): Promise<Message> {
  const api = await getApi();
  const { data } = await api.patch<{ message: unknown }>(
    `/conversations/${conversationId}/offer/${messageId}`,
    { status }
  );
  return mapMessage(data.message);
}

/**
 * Send an image message. The file rides as multipart; backend uploads to
 * Cloudinary and persists the URL on the message (BACKEND_HANDOFF.md §3).
 */
export async function sendImageMessage(
  conversationId: string,
  file: File,
  caption?: string
): Promise<Message> {
  const fd = new FormData();
  fd.append("image", file);
  if (caption) fd.append("caption", caption);
  const { data } = await apiClient().post<{ message: unknown }>(
    `/conversations/${conversationId}/image`,
    fd
  );
  return mapMessage(data.message);
}
