import axios from "axios";

import { apiClient, getApi } from "@/lib/api";

export interface Bank {
  code: string;
  name: string;
}

export interface ResolvedAccount {
  accountName: string;
}

export interface PayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

/** List of Nigerian banks for the payout-account dropdown. Backend caches
 *  the Paystack response server-side for the day. */
export async function getBanks(): Promise<Bank[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ banks?: Bank[]; items?: Bank[] }>(
      "/paystack/banks"
    );
    return data.banks ?? data.items ?? [];
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return [];
    }
    throw err;
  }
}

/** Verify an account number against Paystack's resolve API. Backend proxies
 *  (frontend can't hit Paystack — secret key). Returns the account name on
 *  success; throws on `400 invalid_account`. */
export async function resolveAccount(
  bankCode: string,
  accountNumber: string
): Promise<ResolvedAccount> {
  const { data } = await apiClient().get<ResolvedAccount>(
    "/paystack/resolve-account",
    { params: { bankCode, accountNumber } }
  );
  return { accountName: String(data.accountName ?? "") };
}

/** Save the seller's verified payout account. Backend re-resolves to confirm,
 *  then creates a Paystack Transfer Recipient and persists. */
export async function savePayoutAccount(args: {
  bankCode: string;
  accountNumber: string;
}): Promise<PayoutAccount> {
  const { data } = await apiClient().post<PayoutAccount>(
    "/payout-accounts/me",
    args
  );
  return data;
}

/** Get the current seller's payout account, if set. 404 = no account on
 *  file (not an error — frontend renders the empty/CTA state). */
export async function getMyPayoutAccount(): Promise<PayoutAccount | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<PayoutAccount>("/payout-accounts/me");
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

/** Remove the saved payout account. Backend also deletes the Paystack
 *  Recipient. */
export async function deleteMyPayoutAccount(): Promise<void> {
  await apiClient().delete("/payout-accounts/me");
}

export interface PayoutRow {
  id: string;
  paidOutAt: string;
  /** Gross amount the sweep paid out (kobo-precision decimal string). */
  amount: string;
  /** Paystack bank reference for the Transfer. */
  bankRefId: string;
  /** The transactions whose released lines contributed to this payout. */
  transactionIds: string[];
}

interface PayoutsPage {
  items: PayoutRow[];
  nextCursor: string | null;
}

/** Daily payout history for the current seller. Phase 7 endpoint; tolerant
 *  of pre-deploy 404 so the `/seller/payouts` page renders an empty state. */
export async function getMyPayouts(
  cursor?: string | null
): Promise<PayoutsPage> {
  const api = await getApi();
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;
  try {
    const { data } = await api.get<PayoutsPage>("/seller/payouts", { params });
    return { items: data.items ?? [], nextCursor: data.nextCursor ?? null };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return { items: [], nextCursor: null };
    }
    throw err;
  }
}

export interface InstantPayoutResult {
  id: string;
  paidOutAt: string;
  /** Gross balance before fee. */
  amount: string;
  /** Paystack Transfer fee passed through to the seller. */
  fee: string;
  /** What actually lands in the seller's bank: amount - fee. */
  net: string;
  bankRefId: string;
}

/**
 * Seller-triggered immediate Transfer. Backend deducts the Paystack flat
 * fee (~₦25) from the payout — seller pays this, platform doesn't absorb
 * it for instant cash-outs.
 */
export async function cashOutInstant(): Promise<InstantPayoutResult> {
  const { data } = await apiClient().post<InstantPayoutResult>(
    "/seller/payouts/instant"
  );
  return data;
}
