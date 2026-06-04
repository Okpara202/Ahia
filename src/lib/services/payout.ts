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
  const { data } = await apiClient().post<{ account: PayoutAccount } | PayoutAccount>(
    "/payout-accounts/me",
    args
  );
  // Backend wraps in `{ account }` per Phase 7 spec; tolerate flat too.
  return "account" in data ? data.account : (data as PayoutAccount);
}

/** Get the current seller's payout account, if set. Backend returns
 *  `{ account: null | {...} }`. */
export async function getMyPayoutAccount(): Promise<PayoutAccount | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ account: PayoutAccount | null }>(
      "/payout-accounts/me"
    );
    return data.account ?? null;
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

export type PayoutKind = "sweep" | "cash_out_now";
export type PayoutStatus = "pending" | "paid" | "failed";

export interface PayoutRow {
  id: string;
  /** Decimal-string Naira amount of this payout (gross of any surcharge —
   *  for cash-out, that means the owedBalance at trigger time; the seller's
   *  bank receives netToSeller, the difference being Paystack + Ahia fees). */
  amount: string;
  kind: PayoutKind;
  status: PayoutStatus;
  /** ISO date "YYYY-MM-DD" — null for cash-outs (only sweeps belong to a day). */
  sweepDate: string | null;
  paystackTransferRef: string;
  paidAt: string | null;
  createdAt: string;
  /** The released invoice-line ids that this payout settled — used by the
   *  per-line "Paid out [date]" badge in chat invoice cards. */
  invoiceLineIds: string[];
}

interface PayoutsPage {
  items: PayoutRow[];
  nextCursor: string | null;
  /** Backend echoes the current owedBalance on every page so the consumer
   *  can stay in sync without a separate /auth/me roundtrip. */
  owedBalance: string;
}

/** Daily payout history for the current seller. Tolerates pre-deploy 404
 *  so the page renders an empty state during backend rollout. */
export async function getMyPayouts(
  cursor?: string | null
): Promise<PayoutsPage> {
  const api = await getApi();
  const params: Record<string, string> = {};
  if (cursor) params.cursor = cursor;
  try {
    const { data } = await api.get<PayoutsPage>("/seller/payouts", { params });
    return {
      items: data.items ?? [],
      nextCursor: data.nextCursor ?? null,
      owedBalance: data.owedBalance ?? "0",
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return { items: [], nextCursor: null, owedBalance: "0" };
    }
    throw err;
  }
}

export interface CashOutPreview {
  /** Decimal string. Gross balance available right now. */
  owedBalance: string;
  /** Paystack passthrough fee (currently flat ₦25). */
  paystackFee: string;
  /** Ahia's surcharge on top — 1% of owedBalance. Platform revenue. */
  ahiaSurcharge: string;
  /** What lands in the seller's bank: owedBalance − paystackFee − ahiaSurcharge. */
  netToSeller: string;
  eligible: boolean;
  /** Populated only when eligible = false. */
  reason:
    | "below_minimum"
    | "no_payout_account"
    | "rate_limited"
    | "cooldown"
    | null;
}

/** Preview the breakdown before the seller confirms a cash-out. Backend
 *  exposes the source-of-truth math so the UI doesn't drift. Tolerates
 *  pre-deploy 404. */
export async function previewCashOut(): Promise<CashOutPreview> {
  const api = await getApi();
  try {
    const { data } = await api.get<CashOutPreview>(
      "/seller/payouts/cash-out-now/preview"
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return {
        owedBalance: "0",
        paystackFee: "0",
        ahiaSurcharge: "0",
        netToSeller: "0",
        eligible: false,
        reason: "below_minimum",
      };
    }
    throw err;
  }
}

export interface InstantPayoutResult extends CashOutPreview {
  payoutId: string;
}

/**
 * Seller-triggered immediate Transfer. Backend re-runs the eligibility
 * check, atomically creates the payout row + links released lines, fires
 * the Paystack Transfer, and returns the full breakdown with payoutId.
 *
 * Pricing (Phase 7 final): Paystack flat ₦25 passthrough + 1% Ahia
 * surcharge. So 6% total goes to fees on a cash-out (5% platform + 1%
 * surcharge + ₦25 Paystack), vs 5% for the free daily sweep.
 */
export async function cashOutNow(): Promise<InstantPayoutResult> {
  const { data } = await apiClient().post<InstantPayoutResult>(
    "/seller/payouts/cash-out-now"
  );
  return data;
}
