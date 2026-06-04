import axios from "axios";

import { getApi } from "@/lib/api";
import { BOOST_PLANS, getBoostPlan } from "@/lib/mocks/boosts";
import type { Boost, BoostPlan } from "@/types";

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

export { getBoostPlan };
