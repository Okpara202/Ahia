import { apiClient } from "@/lib/api";
import type { Dispute } from "@/types";

interface RaiseDisputeArgs {
  transactionId: string;
  reason: string;
}

/**
 * Open a dispute against a held transaction. v1 backend doesn't store
 * evidence URLs, so this is JSON-only — no multipart. Reason min is 10
 * chars on the backend; the UI enforces 20 for nudging better quality.
 */
export async function raiseDispute(args: RaiseDisputeArgs): Promise<Dispute> {
  const { data } = await apiClient().post<{ dispute: Dispute }>("/disputes", {
    transactionId: args.transactionId,
    reason: args.reason,
  });
  return data.dispute;
}
