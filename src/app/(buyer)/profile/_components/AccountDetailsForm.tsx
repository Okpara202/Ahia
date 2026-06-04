"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { Typography } from "@/components/Typography";
import { apiClient, extractApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import type { User } from "@/types";

interface AccountDetailsFormProps {
  user: User;
}

export function AccountDetailsForm({ user }: AccountDetailsFormProps) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const dirty = name.trim() !== user.name;

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
    setFieldErrors({});
    try {
      // Backend's User model doesn't carry a phone column in v1 — Zod rejects
      // extra keys, so this body stays tight. Response is `{ user }` per
      // the single-record convention.
      const { data } = await apiClient().patch<{ user: User }>(
        "/users/profile",
        { name: name.trim() }
      );
      useAuthStore.setState({ user: data.user });
      toast.success("Profile updated");
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr?.fields) {
        setFieldErrors(apiErr.fields);
      } else {
        toast.error(
          "Couldn't save profile",
          apiErr?.message ?? "Try again in a moment.",
          apiErr?.requestId
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <Typography variant="heading-h4">Account details</Typography>
      <Input
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
      />
      <Input
        label="Email"
        type="email"
        defaultValue={user.email}
        helperText="Email changes require verification."
        readOnly
      />
      <div className="pt-2">
        <Button
          variant="cta"
          size="lg"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  );
}
