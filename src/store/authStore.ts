import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User, UserRole } from "@/types";

interface AuthState {
  /** Server-seeded profile shown in UI (name, avatar). Always populated by
   *  StoreHydrator on signed-in routes. Guest visitors keep this as null. */
  user: User | null;
  /** True once the user has completed login / signup. Persisted to
   *  localStorage so reloads don't bounce them back to guest. */
  isAuthed: boolean;
  /** True once StoreHydrator has reconciled with the backend — either via
   *  SSR-provided user, or a client-side /auth/me call settling. Auth gates
   *  must wait for this before bouncing the user to /login, otherwise they'd
   *  redirect during the cross-origin reconcile window. Not persisted: it's
   *  per-page-load. */
  authReady: boolean;
  /** Buyer-shell vs seller-shell view. Independent of `user.role` so a
   *  seller (who can also browse) can flip between shells. */
  activeRole: UserRole;
  setUser: (user: User | null) => void;
  setActiveRole: (role: UserRole) => void;
  signIn: (user: User) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthed: false,
      authReady: false,
      activeRole: "buyer",
      setUser: (user) =>
        set({
          user,
          activeRole: user?.role === "seller" ? "seller" : "buyer",
        }),
      setActiveRole: (activeRole) => set({ activeRole }),
      signIn: (user) =>
        set({
          user,
          isAuthed: true,
          authReady: true,
          activeRole: user.role === "seller" ? "seller" : "buyer",
        }),
      signOut: () =>
        set({
          user: null,
          isAuthed: false,
          authReady: true,
          activeRole: "buyer",
        }),
    }),
    {
      name: "ahia-auth",
      // Don't persist the full user record — security and staleness. Only the
      // flag + the view-role survive reloads. The user object is re-seeded
      // server-side via StoreHydrator (or, in production, from the JWT cookie).
      partialize: (s) => ({ isAuthed: s.isAuthed, activeRole: s.activeRole }),
    }
  )
);
