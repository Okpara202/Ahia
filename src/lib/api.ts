import axios, { type AxiosError, type AxiosInstance } from "axios";

import { installAuthInterceptor } from "@/lib/authInterceptor";

const BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    // Fail loudly at module load — better than a silent fallback that masks
    // a missing env var during a deploy. NEXT_PUBLIC_* is inlined at build
    // time, so this check runs once when the bundle is created; a missing
    // value here means the deployment env wasn't configured.
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and " +
        "fill it in (or set it in your Vercel project env)."
    );
  }
  return url;
})();

/**
 * Backend error response shape. Every 4xx/5xx response is guaranteed to be:
 * `{ error: { code, message, fields? } }` per BACKEND_HANDOFF.md §3.
 */
export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

/** Pull the structured error out of an Axios error. Returns null if not a
 *  backend-shaped response (e.g. network error, abort, CORS). */
export function extractApiError(err: unknown): ApiError | null {
  if (axios.isAxiosError(err)) {
    const payload = (err as AxiosError<{ error?: ApiError }>).response?.data;
    if (payload?.error) return payload.error;
  }
  return null;
}

/** True for the specific case "the user isn't logged in". Used by guest-aware
 *  fetchers (e.g. `getCurrentUser`) to return null instead of throwing. */
export function isUnauthorized(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

/**
 * Get an Axios instance configured for the current execution context.
 *
 * - In server components / server actions, build a fresh instance per call
 *   that forwards the incoming request's cookies (so the backend can
 *   authenticate the user). `axios` doesn't read browser cookies on the
 *   server, so we attach them explicitly.
 * - In the browser, reuse a single instance with `withCredentials: true` so
 *   the session cookie rides along on every request automatically.
 */
export async function getApi(): Promise<AxiosInstance> {
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    return axios.create({
      baseURL: BASE_URL,
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      // Server-to-server: don't follow auth redirects automatically.
      maxRedirects: 0,
      validateStatus: (s) => s >= 200 && s < 400,
    });
  }
  return getBrowserApi();
}

let browserInstance: AxiosInstance | null = null;

function getBrowserApi(): AxiosInstance {
  if (browserInstance) return browserInstance;
  browserInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
  });
  installAuthInterceptor(browserInstance);
  return browserInstance;
}

/** Convenience for client components: the browser Axios instance. Equivalent
 *  to `getApi()` but synchronous (no need to await `cookies()` on the client). */
export function apiClient(): AxiosInstance {
  if (typeof window === "undefined") {
    throw new Error(
      "apiClient() called on the server — use `getApi()` instead so cookies are forwarded."
    );
  }
  return getBrowserApi();
}

export { BASE_URL as API_BASE_URL };
