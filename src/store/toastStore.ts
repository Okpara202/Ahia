import { create } from "zustand";

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
  error: (title: string, description?: string) =>
    useToastStore.getState().add({ variant: "error", title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().add({ variant: "info", title, description }),
  /** Center-screen prominent confirmation. Use for events the user needs
   *  to actually notice (role change, shop opened, payment confirmed). */
  confirm: (title: string, description?: string) =>
    useToastStore.getState().add({
      variant: "success",
      title,
      description,
      placement: "center",
    }),
};
