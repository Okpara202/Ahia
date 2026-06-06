import { create } from "zustand";

import { extractApiError } from "@/lib/api";

export type ToastVariant = "success" | "error" | "info";

/** Where on screen the toast appears.
 *  - `corner` — top-right on desktop, top center on mobile. The default for
 *    everyday feedback ("Saved", "Couldn't sign in"). Subtle but visible.
 *  - `center` — viewport-centered, larger card. Reserved for important
 *    confirmations the user needs to actually see, like role changes. */
export type ToastPlacement = "corner" | "center";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  placement: ToastPlacement;
  /** Backend's `X-Request-Id` for the failing request. Rendered as small
   *  muted text under the description so users can include it in bug
   *  reports — backend greps their logs for it. Error toasts only. */
  requestId?: string;
}

interface ToastState {
  toasts: Toast[];
  add: (toast: Omit<Toast, "id" | "placement"> & { placement?: ToastPlacement }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id, placement: toast.placement ?? "corner" },
      ],
    }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative API — usable from any component or event handler. */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().add({ variant: "success", title, description }),
  error: (title: string, description?: string, requestId?: string) =>
    useToastStore
      .getState()
      .add({ variant: "error", title, description, requestId }),
  info: (title: string, description?: string, requestId?: string) =>
    useToastStore
      .getState()
      .add({ variant: "info", title, description, requestId }),
  /** Center-screen prominent confirmation. Use for events the user needs
   *  to actually notice (role change, shop opened, payment confirmed). */
  confirm: (title: string, description?: string) =>
    useToastStore.getState().add({
      variant: "success",
      title,
      description,
      placement: "center",
    }),
  /** Error toast that auto-extracts the backend's structured error and
   *  forwards `requestId` to the toast card. Preferred over `toast.error`
   *  inside `catch (err)` blocks since it surfaces the support ID for free.
   *  `fallback` is shown when the error isn't a backend response (network
   *  blip, abort, CORS). */
  fromApiError: (title: string, err: unknown, fallback?: string) => {
    const apiErr = extractApiError(err);
    return useToastStore.getState().add({
      variant: "error",
      title,
      description:
        apiErr?.message ?? fallback ?? "Something went wrong — try again.",
      requestId: apiErr?.requestId,
    });
  },
};
