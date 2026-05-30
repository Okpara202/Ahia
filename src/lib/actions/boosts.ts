"use server";

import { getApi } from "@/lib/api";
import type { BoostPlanId } from "@/types";

interface BuyBoostArgs {
  productId: string;
  planId: BoostPlanId;
}

interface PaystackInit {
  authorization_url: string;
  reference: string;
}

/**
 * Initiate purchase of a product boost. Backend creates a Paystack transaction
 * with metadata (productId, plan) and returns the authorization URL; the
 * client redirects the browser to it. The webhook actually writes the
 * `boosts` row when payment succeeds (BACKEND_HANDOFF.md §6).
 */
export async function buyBoost(args: BuyBoostArgs): Promise<PaystackInit> {
  const api = await getApi();
  const { data } = await api.post<PaystackInit>("/boosts", {
    productId: args.productId,
    plan: args.planId,
  });
  return data;
}
