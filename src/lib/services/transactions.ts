import axios from "axios";

import { getApi } from "@/lib/api";
import { mapInvoice } from "@/lib/services/conversations";
import type { ChatUser, Transaction, TransactionStatus } from "@/types";

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function mapChatUser(raw: unknown): ChatUser {
  const r = asObject(raw);
  return {
    id: asString(r.id),
    name: asString(r.name, "Unknown"),
    avatarUrl: typeof r.avatarUrl === "string" ? r.avatarUrl : null,
  };
}

/**
 * Chat v1: transactions are now read-only and back the invoice flow.
 * Money movement happens via invoice-line confirm/dispute, not on the
 * transaction itself. The status enum dropped `pending` / `disputed` and
 * gained the partial release/refund states.
 */
export function mapTransaction(raw: unknown): Transaction {
  const r = asObject(raw);
  return {
    id: asString(r.id),
    invoiceId: asString(r.invoiceId),
    buyerId: asString(r.buyerId),
    sellerId: asString(r.sellerId),
    totalPaid: asString(r.totalPaid, "0"),
    platformFee: asString(r.platformFee, "0"),
    paystackRef: asString(r.paystackRef),
    status: asString(r.status, "held") as TransactionStatus,
    paidAt: asString(r.paidAt, new Date(0).toISOString()),
    invoice: mapInvoice(r.invoice),
    buyer: mapChatUser(r.buyer),
    seller: mapChatUser(r.seller),
  };
}

/** Buyer's transactions (every invoice they've paid). */
export async function getTransactions(): Promise<Transaction[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ items?: unknown[] }>("/transactions/me", {
      validateStatus: (s) => s >= 200 && s < 400,
      params: { _t: Date.now() },
    });
    return (Array.isArray(data.items) ? data.items : []).map(mapTransaction);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return [];
    throw err;
  }
}

/** Seller's transactions (every invoice they've been paid for). */
export async function getSellerTransactions(): Promise<Transaction[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ items?: unknown[] }>(
      "/transactions/sales",
      {
        validateStatus: (s) => s >= 200 && s < 400,
        params: { _t: Date.now() },
      }
    );
    return (Array.isArray(data.items) ? data.items : []).map(mapTransaction);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return [];
    throw err;
  }
}

export async function getTransaction(
  transactionId: string
): Promise<Transaction | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ transaction: unknown }>(
      `/transactions/${transactionId}`
    );
    return mapTransaction(data.transaction);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function getTransactionByReference(
  reference: string
): Promise<Transaction | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ transaction: unknown }>(
      `/transactions/by-reference/${reference}`
    );
    return mapTransaction(data.transaction);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}
