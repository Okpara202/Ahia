"use client";

import { useEffect, useState } from "react";

/**
 * Detect Brave via the `navigator.brave.isBrave()` API that Brave intentionally
 * exposes for site detection. NOT user-agent sniffing — Brave hides its UA as
 * Chrome, so UA-based detection is unreliable. Brave shipped this API
 * specifically so sites can adapt to its stricter privacy defaults.
 *
 * Returns false during SSR + first render (the check is async). Flips to true
 * on the next tick if the user is in Brave.
 *
 * Used to surface a one-time banner on auth pages — see {@link BraveAuthWarning}.
 * This whole detection layer comes out once we move to app.ahia.ng + api.ahia.ng
 * (shared eTLD+1 → cookies are same-site → Brave doesn't block them).
 */
interface BraveNavigator extends Navigator {
  brave?: { isBrave?: () => Promise<boolean> };
}

export function useIsBrave(): boolean {
  const [isBrave, setIsBrave] = useState(false);

  useEffect(() => {
    const nav = navigator as BraveNavigator;
    if (typeof nav.brave?.isBrave === "function") {
      nav.brave
        .isBrave()
        .then((result) => {
          if (result) setIsBrave(true);
        })
        .catch(() => undefined);
    }
  }, []);

  return isBrave;
}
