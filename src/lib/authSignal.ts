/**
 * Signals that survive the auth round-trip so post-auth flows can tell
 * "user just attempted to authenticate" from "user landed cold."
 *
 * Used to detect cross-site cookie drops (Brave Shields, Safari ITP, etc.) on
 * the split-origin prototype setup — see CLAUDE.md §11c. When `/auth/me`
 * returns 401 immediately after an auth attempt, that's a cookie-drop
 * fingerprint, not a genuine guest visit.
 *
 * sessionStorage (not localStorage) — the flag is meaningful only until the
 * tab is closed, and we don't want it to outlive the navigation it was set
 * for. Survives cross-origin redirects within the same tab (OAuth handshake).
 */

const KEY = "ahia.justAuthed";

export function markJustAuthed(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // sessionStorage can throw in private modes / sandboxed iframes. Silently
    // skip — the auth flow still works, we just lose the drop-detection
    // signal for this attempt. The `isAuthed` persist flag catches most
    // returning-user cases anyway.
  }
}

export function consumeJustAuthed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const value = sessionStorage.getItem(KEY) === "1";
    if (value) sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return false;
  }
}
