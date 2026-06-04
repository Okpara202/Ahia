"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

import { apiClient, extractApiError } from "@/lib/api";
import { Typography } from "@/components/Typography";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

/**
 * Cold-DM preference toggle on /profile.
 *
 * The toggle controls whether shops the user follows can START fresh
 * conversations with them. Doesn't affect existing conversations or shops
 * the user has already messaged — those reply paths are always open.
 *
 * Backend lands `allowsColdDMs` as part of Phase 7. Until then, the field
 * is undefined on the user record and we render in a "default ON" state
 * with a quiet PATCH attempt; backend will simply 404/ignore an unknown
 * field. Once Phase 7 ships, this becomes the actual round-trip.
 */
export function ColdDMPreference() {
  const user = useAuthStore((s) => s.user);
  // Default to true (matches the Phase 7 default) when backend hasn't
  // surfaced the field yet, so the toggle is in a sane state pre-deploy.
  const initial = user?.allowsColdDMs ?? true;
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    if (saving) return;
    const next = !enabled;
    setEnabled(next); // optimistic
    setSaving(true);
    try {
      await apiClient().patch("/users/profile", { allowsColdDMs: next });
      useAuthStore.setState((s) =>
        s.user ? { user: { ...s.user, allowsColdDMs: next } } : {}
      );
    } catch (err) {
      // Roll back on failure.
      setEnabled(!next);
      toast.error(
        "Couldn't save",
        extractApiError(err)?.message ?? "Try again in a moment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
        >
          <MessageSquare className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <Typography variant="heading-h4">Messages from shops</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Choose whether shops you follow can start new conversations.
          </Typography>
        </div>
      </header>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4 hover:bg-muted/40">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          disabled={saving}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Typography variant="label-md">
            Allow shops I follow to message me
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            Shops you message can always reply to you — this only controls
            whether shops you follow can start new conversations.
          </Typography>
        </div>
      </label>
    </section>
  );
}
