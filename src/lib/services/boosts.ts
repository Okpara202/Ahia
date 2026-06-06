import axios from "axios";

import {
  apiClient,
  getApi,
  normalizePaystackInit,
  type PaystackInit,
} from "@/lib/api";
import { BOOST_PLANS, getBoostPlan } from "@/lib/mocks/boosts";
import type { Boost, BoostPlan, BoostPlanId } from "@/types";

// Plans still live in `@/lib/mocks/boosts` as a fallback. Once we want
// pricing changes without a frontend deploy, the BOOST_PLANS export here
// will hydrate from the GET /boosts/plans endpoint and the local file
// becomes the default-on-cold-start.

/** Plan list. Falls back to the local seed if backend hasn't shipped
 *  `/boosts/plans` or it's transiently unavailable. */
export async function listBoostPlans(): Promise<BoostPlan[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ plans?: BoostPlan[]; items?: BoostPlan[] }>(
      "/boosts/plans"
    );
    const plans = data.plans ?? data.items ?? [];
    return plans.length > 0 ? plans : BOOST_PLANS;
  } catch (err) {
    if (axios.isAxiosError(err)) return BOOST_PLANS;
    throw err;
  }
}

/** Active boosts for the shop the seller owns. Used by /seller/products to
 *  badge boosted product cards. Tolerates pre-deploy 404. */
export async function getActiveBoostsForShop(shopId: string): Promise<Boost[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ items?: Boost[]; boosts?: Boost[] }>(
      `/shops/${shopId}/boosts`
    );
    return data.items ?? data.boosts ?? [];
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
}

/** Currently-active boost for one product, if any. Powers the "Sponsored"
 *  badge on individual product detail pages. */
export async function getActiveBoostForProduct(
  productId: string
): Promise<Boost | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ boost: Boost | null }>(
      `/products/${productId}/boost`
    );
    return data.boost ?? null;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/** Seller's own active boosts (across all their products). Powers the
 *  /seller/products boost summary widget. */
export async function getMyBoosts(): Promise<Boost[]> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ items?: Boost[]; boosts?: Boost[] }>(
      "/boosts/me"
    );
    return data.items ?? data.boosts ?? [];
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    throw err;
  }
}

interface BuyBoostArgs {
  productId: string;
  planId: BoostPlanId;
  /** Where Paystack returns the browser after payment — pass
   *  `${origin}/payments/return`. Without this, Paystack falls back to
   *  the dashboard-configured URL (the backend webhook), and the seller
   *  lands on a JSON 404 page. Same parameter `payInvoice` accepts. */
  callbackUrl?: string;
  /** UUID generated at click time to dedupe accidental double-submits
   *  (network blip, React double-render, etc.). Backend keeps a 5-min
   *  Redis lock keyed by this; a second request with the same key returns
   *  `409 duplicate_request`. Caller should generate via
   *  `crypto.randomUUID()` on each Pay click — same key on retry of a
   *  single intent. */
  idempotencyKey?: string;
}

/**
 * Initiate purchase of a product boost. Backend creates a Paystack
 * transaction with metadata (productId, plan) and returns the
 * authorization URL; the caller redirects the browser to it. Backend
 * writes the `boosts` row on the Paystack webhook.
 *
 * Lives in services/ as a client-side call — server actions silently
 * fail against the cross-origin backend because Next.js can't forward
 * the session cookie (see CLAUDE.md §11c). Same migration we did for
 * `deleteProduct` and `setProductVisibility`.
 */
export async function buyBoost(args: BuyBoostArgs): Promise<PaystackInit> {
  const body: Record<string, string> = {
    productId: args.productId,
    plan: args.planId,
  };
  if (args.callbackUrl) body.callbackUrl = args.callbackUrl;
  const headers: Record<string, string> = {};
  if (args.idempotencyKey) headers["Idempotency-Key"] = args.idempotencyKey;
  const { data } = await apiClient().post<Record<string, unknown>>(
    "/boosts",
    body,
    Object.keys(headers).length > 0 ? { headers } : undefined
  );
  return normalizePaystackInit(data, "boosts");
}

export { getBoostPlan };
