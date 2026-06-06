import axios, { type AxiosError, type AxiosInstance } from "axios";

import { consumeJustAuthed } from "@/lib/authSignal";
import { useAuthStore } from "@/store/authStore";

interface ApiErrorBody {
  error?: { code?: string; message?: string; requestId?: string };
}

/**
 * Global 401 handler installed on the browser Axios instance.
 *
 * The cross-site cookie problem (Brave Shields, Safari ITP, etc.) on our
 * split-origin prototype causes 401s in three distinct scenarios:
 *
 *   1. Brand-new user attempts auth → cookie blocked → /auth/me 401s on first land
 *   2. Returning user with a working session → toggles Shields mid-session →
 *      cookie now blocked → next API call 401s
 *   3. Session genuinely expired (7-day window) → 401 like above
 *
 * In all three, "Couldn't do X" toasts are misleading. The right move is a
 * dedicated /help/sign-in-blocked page that explains both the browser-policy
 * and the genuine-expiry case in one place.
 *
 * The interceptor decides who to redirect using two signals:
 *   - `isAuthed` (zustand persist) — "user thinks they have a session"
 *   - `ahia.justAuthed` (sessionStorage) — "user just attempted to authenticate"
 *
 * If either is set, a 401 indicates a contradiction worth surfacing. If
 * neither is set, the user is a genuine guest and we let the call's local
 * catch handler deal with it (e.g. login form showing "wrong password").
 *
 * Remove this interceptor when we migrate to app.ahia.ng + api.ahia.ng —
 * shared eTLD+1 means no more cross-site cookie drops.
 */

const PUBLIC_AUTH_PATHS = ["/login", "/signup", "/forgot-password"] as const;
const REDIRECT_BLOCKED = "/help/sign-in-blocked";
const REDIRECT_SUSPENDED = "/account-suspended";

function shouldSuppressOnPath(pathname: string): boolean {
  if (pathname === REDIRECT_BLOCKED) return true;
  if (pathname === REDIRECT_SUSPENDED) return true;
  return PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}?`));
}

function isCredentialCheckUrl(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/signup") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/reset-password")
  );
}

export function installAuthInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (!axios.isAxiosError(error)) return Promise.reject(error);
      const axiosErr = error as AxiosError<ApiErrorBody>;
      const status = axiosErr.response?.status;
      const code = axiosErr.response?.data?.error?.code;

      // 403 account_suspended: backend confirms the user row has
      // status="suspended". Cookie is still valid cryptographically — backend
      // doesn't clear it — so we sign out locally to drop the persisted
      // `isAuthed` flag, then redirect to the suspended-account page with
      // the reason + requestId in the query string. Same suppression rule:
      // don't redirect when we're already on the suspended page or a
      // public auth page (those handle the message inline).
      if (status === 403 && code === "account_suspended") {
        if (typeof window !== "undefined" && shouldSuppressOnPath(window.location.pathname)) {
          return Promise.reject(error);
        }
        useAuthStore.getState().signOut();
        if (typeof window !== "undefined") {
          const body = axiosErr.response?.data?.error;
          const reason = body?.message ?? "";
          const requestId = body?.requestId ?? "";
          const qs = new URLSearchParams();
          if (reason) qs.set("reason", reason);
          if (requestId) qs.set("ref", requestId);
          const search = qs.toString();
          window.location.href = `${REDIRECT_SUSPENDED}${search ? `?${search}` : ""}`;
        }
        // Swallow so callers don't flash a misleading toast on the way out.
        return new Promise<never>(() => undefined);
      }

      if (status !== 401) return Promise.reject(error);

      // Don't redirect when we're already on a page that handles auth itself —
      // login/signup forms show their own field-level errors, and the help
      // page must not loop back to itself.
      if (typeof window !== "undefined" && shouldSuppressOnPath(window.location.pathname)) {
        return Promise.reject(error);
      }

      // 401 on /auth/login or /auth/signup is "wrong credentials" — the form
      // surfaces that itself with a useful message. Not a session-drop case.
      if (isCredentialCheckUrl(axiosErr.config?.url)) {
        return Promise.reject(error);
      }

      const hadSession = useAuthStore.getState().isAuthed;
      const justAuthed = consumeJustAuthed();

      if (hadSession || justAuthed) {
        // Clear the contradictory client state, then hard-navigate so the
        // help page renders in a clean tree (no in-flight requests trying to
        // re-fire against the now-dead session).
        useAuthStore.getState().signOut();
        if (typeof window !== "undefined") {
          window.location.href = REDIRECT_BLOCKED;
        }
        // Don't propagate the rejection — the redirect is happening on the
        // next tick and we don't want callers to flash a misleading toast
        // ("Couldn't save your role", "Couldn't send", etc.) in the meantime.
        // Returning a never-resolving promise leaves any local loading state
        // visible until the navigation tears down the page. The promise is
        // GC'd when the page unloads.
        return new Promise<never>(() => undefined);
      }

      return Promise.reject(error);
    }
  );
}
