import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
import type { Media, Transaction, TransactionStatus } from "@/types";

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function mapTransaction(raw: unknown): Transaction {
  const r = raw as Record<string, unknown>;
  const product = (r.product ?? {}) as Record<string, unknown>;
  const shop = (r.shop ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id),
    product: {
      id: String(product.id ?? ""),
      name: String(product.name ?? ""),
      media: product.media as Media,
    },
    shop: {
      id: String(shop.id ?? ""),
      name: String(shop.name ?? ""),
      handle: String(shop.handle ?? ""),
    },
    amount: toNumber(r.amount),
    platformFee: toNumber(r.platformFee),
    status: r.status as TransactionStatus,
    createdAt: String(r.createdAt ?? new Date().toISOString()),
  };
}

export async function getTransactions(): Promise<Transaction[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{
      items?: unknown[];
      transactions?: unknown[];
    }>("/transactions");
    return ((data.items ?? data.transactions) ?? []).map(mapTransaction);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return [];
    throw err;
  }
}

interface PaystackInit {
  authorization_url: string;
  reference: string;
}

/**
 * Initiate payment for a product. Backend's escrow model is
 * webhook-as-source-of-truth: no `transactions` row exists until Paystack
 * confirms — so we don't have a transaction id to call against yet. The
 * buyer's "Pay" button hits this with the product id; the row materializes
 * after the success webhook (status=`held`), at which point `transaction:paid`
 * lands over the socket.
 */
export async function startCheckout(
  productId: string
): Promise<PaystackInit> {
  const { data } = await apiClient().post<PaystackInit>("/transactions", {
    productId,
  });
  return data;
}

/**
 * Buyer confirms delivery → backend releases funds from escrow to the seller.
 */
export async function confirmDelivery(transactionId: string): Promise<void> {
  await apiClient().post(`/transactions/${transactionId}/confirm`);
}

/**
 * Fetch a single transaction — used by the Paystack return page to render
 * the final state after a redirect.
 */
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
