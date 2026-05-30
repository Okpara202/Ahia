"use client";

import { useEffect, useState } from "react";

import { useSocket } from "@/hooks/useSocket";
import { apiClient, isUnauthorized } from "@/lib/api";
import {
  getWishlist,
  mergeWishlist,
} from "@/lib/services/wishlist";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type {
  ConversationListItem,
  Notification,
  User,
  UserRole,
} from "@/types";

interface StoreHydratorProps {
  /** Server-fetched current user. `null` means the SSR layout couldn't reach
   *  the backend with the session cookie — could be a genuine guest, or
   *  cross-origin SSR blocking the backend cookie (cookies set on the
   *  backend's domain don't ride along on the localhost SSR request). The
   *  client-side recovery below handles the latter case. */
  user: User | null;
  activeRole: UserRole;
  conversations: ConversationListItem[];
  notifications: Notification[];
}

/**
 * Seeds zustand stores with server-fetched data on first render.
 * Renders nothing. Place near the top of each layout, before any consumer.
 */
export function StoreHydrator({
  user,
  activeRole,
  conversations,
  notifications,
}: StoreHydratorProps) {
  useState(() => {
    if (user) {
      useAuthStore.setState({
        user,
        isAuthed: true,
        authReady: true,
        activeRole,
      });
      // First render after sign-in: push any locally-persisted wishlist to
      // the server, then re-seed the store with the unioned server set.
      // Fire-and-forget; never block the page on this.
      const localIds = useWishlistStore.getState().ids;
      void mergeWishlist(localIds)
        .then(() => getWishlist())
        .then((ids) => useWishlistStore.getState().setIds(ids))
        .catch(() => undefined);
    }
    // If `user` is null we deliberately do NOT clobber the store. Either:
    //  - persist already says guest → store is already guest, no-op
    //  - we just signed in client-side (signIn() ran in the form) → store
    //    holds the fresh user; SSR couldn't see the cookie cross-origin
    //  - session genuinely expired → the client recovery below catches it
    useChatStore.getState().setConversations(conversations);
    useNotificationStore.getState().setItems(notifications);
    return null;
  });

  const storeUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) return; // SSR already confirmed
    if (storeUser) return; // already recovered on a prior tick

    // SSR couldn't see the session cookie (cross-origin: Vercel ↔ Render
    // can't share cookies between domains). The cookie itself — not the
    // persisted `isAuthed` flag — is the source of truth, so we always
    // reconcile against /auth/me on first load. The persist can be stale
    // either way (poisoned by a bad signOut, or simply not yet written),
    // and one extra request per page load is a fair price for correctness.
    apiClient()
      .get<{ user: User }>("/auth/me")
      .then(({ data }) => {
        useAuthStore.setState({
          user: data.user,
          isAuthed: true,
          authReady: true,
        });
      })
      .catch((err) => {
        // Cookie-drop cases (Brave Shields, expired session) are handled by
        // the global auth interceptor — see lib/authInterceptor.ts. It will
        // already have signed out + navigated to /help/sign-in-blocked by
        // the time this catch runs. The branches below handle the remaining
        // cases:
        //   - Genuine guest 401 with no prior session → just signOut() to
        //     clear the persisted `authReady: false` and let gates redirect.
        //   - Transient (5xx, network, cold start) → don't boot anyone; mark
        //     ready so gates don't hang on an infinite spinner.
        if (isUnauthorized(err)) {
          useAuthStore.getState().signOut(); // sets authReady: true
        } else {
          useAuthStore.setState({ authReady: true });
        }
      });
  }, [user, storeUser]);

  useSocket();

  return null;
}
