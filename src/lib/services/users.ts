import { getApi, isUnauthorized } from "@/lib/api";
import type { User } from "@/types";

/**
 * Get the currently signed-in user from the session cookie.
 * Backend wraps `{ user }` per the single-record convention. Returns `null`
 * for guests (401) so layouts can render the public shell instead of
 * redirecting.
 */
export async function getCurrentUser(): Promise<User | null> {
  const api = await getApi();
  try {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  } catch (err) {
    if (isUnauthorized(err)) return null;
    throw err;
  }
}
