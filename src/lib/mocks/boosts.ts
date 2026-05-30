import type { Boost, BoostPlan } from "@/types";

/**
 * Placeholder pricing — flat fee per month, awaiting team decision.
 * Per-month equivalents are derived in `BOOST_PLANS`.
 */
export const BOOST_PLANS: BoostPlan[] = [
  {
    id: "monthly",
    label: "1 month",
    months: 1,
    priceNaira: 5000,
    perMonthNaira: 5000,
  },
  {
    id: "quarterly",
    label: "3 months",
    months: 3,
    priceNaira: 12000,
    perMonthNaira: 4000,
    tag: "Most popular",
  },
  {
    id: "biannual",
    label: "6 months",
    months: 6,
    priceNaira: 20000,
    perMonthNaira: 3333,
    tag: "Best value",
  },
];

export function getBoostPlan(id: string): BoostPlan | undefined {
  return BOOST_PLANS.find((p) => p.id === id);
}

/**
 * Mock active boosts. Mutated in-memory by the boost server action when
 * a seller pays. Boost IDs the buyer-facing services treat as sponsored
 * are derived from this list (any boost where now ∈ [startsAt, endsAt]).
 */
export const MOCK_BOOSTS: Boost[] = [
  {
    id: "b_01",
    productId: "mp_02",
    shopId: "s_me",
    plan: "quarterly",
    amountPaid: 12000,
    startsAt: "2026-05-01T00:00:00Z",
    endsAt: "2026-08-01T00:00:00Z",
    active: true,
  },
  {
    id: "b_02",
    productId: "mp_05",
    shopId: "s_me",
    plan: "monthly",
    amountPaid: 5000,
    startsAt: "2026-05-20T00:00:00Z",
    endsAt: "2026-06-20T00:00:00Z",
    active: true,
  },
  {
    id: "b_03",
    productId: "p_02",
    shopId: "s_02",
    plan: "biannual",
    amountPaid: 20000,
    startsAt: "2026-04-15T00:00:00Z",
    endsAt: "2026-10-15T00:00:00Z",
    active: true,
  },
  {
    id: "b_04",
    productId: "p_12",
    shopId: "s_10",
    plan: "monthly",
    amountPaid: 5000,
    startsAt: "2026-05-15T00:00:00Z",
    endsAt: "2026-06-15T00:00:00Z",
    active: true,
  },
  {
    id: "b_05",
    productId: "p_03",
    shopId: "s_03",
    plan: "quarterly",
    amountPaid: 12000,
    startsAt: "2026-05-01T00:00:00Z",
    endsAt: "2026-08-01T00:00:00Z",
    active: true,
  },
  {
    id: "b_06",
    productId: "p_06",
    shopId: "s_06",
    plan: "monthly",
    amountPaid: 5000,
    startsAt: "2026-05-20T00:00:00Z",
    endsAt: "2026-06-20T00:00:00Z",
    active: true,
  },
];
