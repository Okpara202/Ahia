import axios from "axios";

import { apiClient, getApi } from "@/lib/api";
import { getShopProducts } from "@/lib/services/shops";
import { getTransactions } from "@/lib/services/transactions";
import type { Product, Shop, Transaction } from "@/types";

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function mapShop(raw: unknown): Shop {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    handle: String(r.handle ?? ""),
    verified: Boolean(r.verified ?? false),
    bio: (r.bio as string | undefined) ?? undefined,
    avatarUrl: (r.avatarUrl as string | undefined) ?? undefined,
    bannerUrl: (r.bannerUrl as string | undefined) ?? undefined,
    showLegalName: (r.showLegalName as boolean | undefined) ?? undefined,
    createdAt: (r.createdAt as string | undefined) ?? undefined,
    updatedAt: (r.updatedAt as string | undefined) ?? undefined,
    totalSales:
      r.totalSales !== undefined ? toNumber(r.totalSales) : undefined,
    location: (r.location as string | undefined) ?? undefined,
    category: (r.category as string | undefined) ?? undefined,
    ownerId: (r.ownerId as string | undefined) ?? undefined,
    isActive: (r.isActive as boolean | undefined) ?? undefined,
    deletedAt: (r.deletedAt as string | null | undefined) ?? undefined,
    ownerName: (r.ownerName as string | undefined) ?? undefined,
    productsCount:
      r.productsCount !== undefined ? toNumber(r.productsCount) : undefined,
    isFollowing: (r.isFollowing as boolean | undefined) ?? undefined,
    followerCount:
      r.followerCount !== undefined ? toNumber(r.followerCount) : undefined,
  };
}

export async function getMyShop(): Promise<Shop | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ shop: unknown }>("/shops/me");
    return mapShop(data.shop);
  } catch (err) {
    // Brand-new sellers haven't created a shop yet — null lets the UI fall
    // through to the create-shop prompt without crashing.
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export interface CreateShopArgs {
  name: string;
  handle: string;
  category: string;
  location?: string;
  bio?: string;
  showLegalName?: boolean;
}

export async function createShop(args: CreateShopArgs): Promise<Shop> {
  const { data } = await apiClient().post<{ shop: unknown }>("/shops", {
    name: args.name,
    handle: args.handle,
    category: args.category,
    location: args.location,
    bio: args.bio,
    showLegalName: args.showLegalName ?? false,
  });
  return mapShop(data.shop);
}

/**
 * Permanently delete the current user's shop. Backend soft-deletes (sets
 * `deletedAt`) so historical conversations, transactions, reviews, and
 * disputes still resolve. The user's `role` flips back to `"buyer"` on
 * the same request — they can later open a new shop fresh.
 */
export async function deleteShop(): Promise<void> {
  await apiClient().delete("/shops/me");
}

/**
 * Pause the current user's shop. Hides it from feed/search/locations and
 * blocks new conversation/transaction starts (backend enforces). Existing
 * conversations and in-flight transactions keep working untouched.
 *
 * Role is NOT flipped on pause (Phase 2 — `isActive` is the canonical
 * signal now).
 */
export async function pauseShop(): Promise<Shop> {
  const { data } = await apiClient().patch<{ shop: unknown }>("/shops/me", {
    isActive: false,
  });
  return mapShop(data.shop);
}

/**
 * Reopen a paused shop. Restores feed/search visibility and lifts the
 * new-buyer block.
 */
export async function reopenShop(): Promise<Shop> {
  const { data } = await apiClient().patch<{ shop: unknown }>("/shops/me", {
    isActive: true,
  });
  return mapShop(data.shop);
}

/**
 * Edit shop fields. Used by the shop settings form. Keep separate from
 * pause/reopen so callers can't accidentally toggle visibility while editing.
 */
export interface UpdateShopArgs {
  name?: string;
  handle?: string;
  bio?: string;
  category?: string;
  location?: string;
  showLegalName?: boolean;
}

export async function updateShop(args: UpdateShopArgs): Promise<Shop> {
  const { data } = await apiClient().patch<{ shop: unknown }>("/shops/me", args);
  return mapShop(data.shop);
}

/**
 * Products in the signed-in seller's shop. Thin wrapper around
 * `getShopProducts(shopId)` — the seller's shopId comes from the
 * `useSellerShopStore` populated by `SellerShellGate` on entry.
 */
export async function getMyProducts(shopId: string): Promise<Product[]> {
  return getShopProducts(shopId);
}

/**
 * Seller's transaction history. Backend uses the session cookie to scope
 * results, so this is identical to `getTransactions()` — keeping the name
 * for read-site clarity ("seller transactions" reads naturally on the
 * seller dashboard).
 */
export async function getSellerTransactions(): Promise<Transaction[]> {
  return getTransactions();
}

export interface SellerDashboardStats {
  /** Lifetime revenue from released transactions (after fees). */
  totalEarned: number;
  /** Currently held in escrow (gross). */
  pendingPayout: number;
  /** Count of completed (released) sales. */
  completedSales: number;
  /** Count of conversations with unread messages. */
  unreadConversations: number;
  /** Count of active disputes. */
  openDisputes: number;
  /** Net earnings in the trailing 7 days. */
  thisWeekEarned: number;
  /** Net earnings in the 8-14 day window. */
  lastWeekEarned: number;
  /** Completed sales in the trailing 7 days. */
  thisWeekSales: number;
}

/**
 * Derive dashboard KPIs from a transaction list and unread-conversation
 * count. The caller fetches both and passes them in so we don't double-
 * fetch transactions across the dashboard. When the backend ships an
 * aggregated stats endpoint, swap this for a single request.
 */
export function computeDashboardStats(
  transactions: Transaction[],
  unreadConversations: number,
  now: number
): SellerDashboardStats {
  const DAY = 24 * 60 * 60 * 1000;
  const released = transactions.filter((t) => t.status === "released");

  const totalEarned = released.reduce(
    (sum, t) => sum + (t.amount - t.platformFee),
    0
  );
  const pendingPayout = transactions
    .filter((t) => t.status === "held")
    .reduce((sum, t) => sum + t.amount, 0);
  const openDisputes = transactions.filter(
    (t) => t.status === "disputed"
  ).length;

  const thisWeek = released.filter(
    (t) => now - new Date(t.createdAt).getTime() <= 7 * DAY
  );
  const lastWeek = released.filter((t) => {
    const ageMs = now - new Date(t.createdAt).getTime();
    return ageMs > 7 * DAY && ageMs <= 14 * DAY;
  });

  return {
    totalEarned,
    pendingPayout,
    completedSales: released.length,
    unreadConversations,
    openDisputes,
    thisWeekEarned: thisWeek.reduce(
      (sum, t) => sum + (t.amount - t.platformFee),
      0
    ),
    lastWeekEarned: lastWeek.reduce(
      (sum, t) => sum + (t.amount - t.platformFee),
      0
    ),
    thisWeekSales: thisWeek.length,
  };
}
