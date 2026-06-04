"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput";
import { apiClient, extractApiError } from "@/lib/api";
import { markJustAuthed } from "@/lib/authSignal";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import type { User } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit() {
    setSubmitting(true);
    setFieldErrors({});
    try {
      const { data } = await apiClient().post<{ user: User }>("/auth/login", {
        email: email.trim(),
        password,
      });
      useAuthStore.getState().signIn(data.user);
      markJustAuthed();
      router.push(nextPath ?? "/feed");
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr?.fields) {
        setFieldErrors(apiErr.fields);
      } else {
        toast.error(
          "Couldn't sign in",
          apiErr?.message ?? "Check your email and password, or try Google.",
          apiErr?.requestId
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        autoFocus
        error={fieldErrors.email}
      />
      <PasswordInput
        label="Password"
        labelEndAdornment={
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        }
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        error={fieldErrors.password}
      />

      <Button
        onClick={handleSubmit}
        variant="cta"
        size="lg"
        className="mt-2 w-full"
        disabled={submitting}
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "Signing in…" : "Sign in"}
        {!submitting && <ArrowRight className="size-4" />}
      </Button>
    </div>
  );
}
