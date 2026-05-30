"use client";

import { useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/Typography";
import { toast } from "@/store/toastStore";

interface ReferralSectionProps {
  /** Stable referral code derived from the user — e.g. user handle without @. */
  code: string;
}

export function ReferralSection({ code }: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${code}`
      : `https://ahia.ng/r/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy", "Long-press to copy manually.");
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Join me on Ahia — the marketplace where escrow keeps your money safe till delivery. Use my link: ${link}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent"
        >
          <Gift className="size-4" />
        </span>
        <div className="flex flex-col gap-1">
          <Typography variant="heading-h4">Refer & earn</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Earn{" "}
            <span className="font-semibold text-foreground">₦500 credit</span>{" "}
            when a friend completes their first sale — and they get ₦500 off
            their first paid boost. No cap.
          </Typography>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-background p-3 sm:flex-row sm:items-center">
        <Typography
          variant="label-sm"
          className="break-all font-mono text-muted-foreground sm:flex-1"
        >
          {link}
        </Typography>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            {copied ? (
              <>
                <Check className="size-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="cta"
            size="sm"
            onClick={shareWhatsApp}
          >
            <Share2 className="size-3.5" />
            WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
}
