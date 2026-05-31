"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { apiClient, extractApiError } from "@/lib/api";

type Status = "pending" | "success" | "failed" | "timeout";

interface PaystackResolution {
  status: "success" | "failed" | "pending";
  /** Where to land the user once resolved. e.g. `/inbox/c_01` for chat-pay,
   *  `/seller/products` for a boost, `/seller/ads/:id` for a campaign. */
  next?: string;
  message?: string;
}

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 20;
// After this many polls with no resolution, surface an "exit" button so the
// user isn't trapped on the spinner if Paystack is being slow.
const SHOW_ESCAPE_AFTER_ATTEMPTS = 4;

export function PaystackReturn() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref") ?? "";
  const [status, setStatus] = useState<Status>("pending");
  const [next, setNext] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    if (!reference) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("failed");
      setMessage("No payment reference found in the return URL.");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      setAttemptCount(attempts);
      try {
        const { data } = await apiClient().get<PaystackResolution>(
          `/payments/verify/${reference}`
        );
        if (cancelled) return;
        if (data.status === "success") {
          setNext(data.next ?? null);
          setStatus("success");
          if (data.next) window.location.href = data.next;
          return;
        }
        if (data.status === "failed") {
          setMessage(data.message ?? "The payment did not complete.");
          setStatus("failed");
          return;
        }
      } catch (err) {
        if (cancelled) return;
        // 4xx (other than 401 which the interceptor handles) is a permanent
        // failure — the transaction record says it failed or doesn't exist.
        // Stop polling and surface the message instead of spinning for 30s.
        const code = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (code && code >= 400 && code < 500 && code !== 401) {
          setMessage(
            extractApiError(err)?.message ??
              "The payment did not complete."
          );
          setStatus("failed");
          return;
        }
        // 5xx / network — keep polling but remember the latest message so
        // the eventual timeout card has something useful to show.
        setMessage(extractApiError(err)?.message ?? "");
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        setStatus("timeout");
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (status === "pending") {
    const showEscape = attemptCount >= SHOW_ESCAPE_AFTER_ATTEMPTS;
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <Typography variant="heading-h3">Confirming with Paystack…</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Hold on — this usually takes a few seconds.
        </Typography>
        {showEscape && (
          <>
            <Typography variant="caption" className="text-muted-foreground">
              Taking longer than expected. You can come back later — we&apos;ll
              notify you the moment it resolves.
            </Typography>
            <Button asChild variant="outline" size="sm">
              <Link href="/inbox">Back to inbox</Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-6" strokeWidth={3} />
        </span>
        <Typography variant="heading-h3">Payment received</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Redirecting you back…
        </Typography>
        {next && (
          <Button asChild variant="cta" size="lg">
            <Link href={next}>Continue</Link>
          </Button>
        )}
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="size-8 text-muted-foreground" />
        <Typography variant="heading-h3">Still confirming</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Paystack is taking longer than usual. We&apos;ll notify you the
          moment it resolves — feel free to keep using Ahia in the meantime.
        </Typography>
        <Button asChild variant="cta" size="lg">
          <Link href="/feed">Back to feed</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <Typography variant="heading-h3">Payment didn&apos;t complete</Typography>
      <Typography variant="body-sm" className="text-muted-foreground">
        {message || "No money has been taken. You can try the payment again."}
      </Typography>
      <Button asChild variant="cta" size="lg">
        <Link href="/inbox">Back to inbox</Link>
      </Button>
    </div>
  );
}
