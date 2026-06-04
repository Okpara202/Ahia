"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput";
import { Typography } from "@/components/Typography";
import { apiClient, extractApiError } from "@/lib/api";
import { markJustAuthed } from "@/lib/authSignal";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import type { User } from "@/types";

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const roleHint = params.get("role");
  const nextPath = params.get("next");
  const referralCode = params.get("ref");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit() {
    setSubmitting(true);
    setFieldErrors({});
    try {
      const { data } = await apiClient().post<{ user: User }>("/auth/signup", {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      useAuthStore.getState().signIn(data.user);
      markJustAuthed();

      // Fire-and-forget referral claim — never block onboarding on this.
      if (referralCode) {
        apiClient()
          .post("/referrals/claim", { code: referralCode })
          .catch(() => undefined);
      }

      const qs = new URLSearchParams();
      if (roleHint) qs.set("role", roleHint);
      if (nextPath) qs.set("next", nextPath);
      const query = qs.toString();
      router.push(query ? `/onboarding?${query}` : "/onboarding");
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr?.fields) {
        setFieldErrors(apiErr.fields);
      } else {
        toast.error(
          "Couldn't create account",
          apiErr?.message ?? "Try again, or sign up with Google.",
          apiErr?.requestId
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="text"
        label="Full name"
        placeholder="Chidera Okonkwo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        autoFocus
        error={fieldErrors.name}
      />
      <Input
        type="email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        error={fieldErrors.email}
      />
      <PasswordInput
        label="Password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        helperText={fieldErrors.password ? undefined : "Use 8+ characters."}
        autoComplete="new-password"
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
        {submitting ? "Creating account…" : "Create account"}
        {!submitting && <ArrowRight className="size-4" />}
      </Button>

      <Typography variant="caption" className="text-center text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link href="/legal/terms" className="underline hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </Typography>
    </div>
  );
}
