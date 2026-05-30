import { BOOST_PLANS, MOCK_BOOSTS, getBoostPlan } from "@/lib/mocks/boosts";
import type { Boost, BoostPlan } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listBoostPlans(): Promise<BoostPlan[]> {
  await delay(50);
  return BOOST_PLANS;
}

/** Boost IDs that should render as Sponsored right now. */
export function activeBoostedProductIds(now: Date = new Date()): Set<string> {
  const t = now.getTime();
  return new Set(
    MOCK_BOOSTS.filter(
      (b) =>
        b.active &&
        new Date(b.startsAt).getTime() <= t &&
        new Date(b.endsAt).getTime() >= t
    ).map((b) => b.productId)
  );
}

export async function getActiveBoostsForShop(shopId: string): Promise<Boost[]> {
  await delay(150);
  const now = Date.now();
  return MOCK_BOOSTS.filter(
    (b) =>
      b.shopId === shopId &&
      b.active &&
      new Date(b.endsAt).getTime() >= now
  );
}

export async function getActiveBoostForProduct(
  productId: string
): Promise<Boost | null> {
  await delay(80);
  const now = Date.now();
  return (
    MOCK_BOOSTS.find(
      (b) =>
        b.productId === productId &&
        b.active &&
        new Date(b.startsAt).getTime() <= now &&
        new Date(b.endsAt).getTime() >= now
    ) ?? null
  );
}

export { getBoostPlan };
