"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Render children into a fixed-positioning-safe spot at the end of
 * `document.body`. Any ancestor with `transform`, `filter`, `will-change`, or
 * `perspective` creates a new containing block for `position: fixed`, which
 * silently scopes our modal backdrops to that ancestor instead of the
 * viewport (you see the modal off-centre, clipped to a content column). The
 * portal escapes that.
 *
 * SSR-safe: returns null on the first server render, mounts after hydration.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Canonical SSR-detection pattern — fires once on first client paint so we
    // can safely call `createPortal(children, document.body)` below. The
    // server render returns null; the client mount swaps in the portal. No
    // hydration mismatch because the first client render still matches the
    // server (mounted=false) — the swap happens on the next commit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
