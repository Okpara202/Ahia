"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  PauseCircle,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/Input";
import { Typography } from "@/components/Typography";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteShop, pauseShop } from "@/lib/services/seller";
import { useAuthStore } from "@/store/authStore";
import { useSellerShopStore } from "@/store/sellerShopStore";
import { toast } from "@/store/toastStore";

type Step = "choose" | "confirm-pause" | "confirm-delete";

/**
 * Entry point for stepping away from selling. Opens a multi-stage flow:
 *
 *  1. Choose — Pause (reversible) or Close permanently (destructive)
 *  2a. If pause → consequences screen, then `PATCH /shops/me { isActive: false }`
 *  2b. If permanently → type-to-confirm with the user's shop handle, then
 *      `DELETE /shops/me`
 *
 * Both branches show full consequences before committing. We never auto-flip
 * role on pause anymore — `shop.isActive` is the canonical signal (Phase 2).
 */
export function DeleteShopButton() {
  const router = useRouter();
  const shop = useSellerShopStore((s) => s.shop);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [pausing, setPausing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [handleInput, setHandleInput] = useState("");

  function reset() {
    setStep("choose");
    setPausing(false);
    setDeleting(false);
    setHandleInput("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reset after the close animation so the user doesn't see the form
      // snap back to the choice step mid-dismiss.
      setTimeout(reset, 200);
    }
  }

  async function handleConfirmPause() {
    if (pausing) return;
    setPausing(true);
    try {
      const updated = await pauseShop();
      useSellerShopStore.getState().setShop(updated);
      toast.confirm(
        "Your shop is paused",
        "Existing buyers can still reach you. Reopen any time from your dashboard."
      );
      setOpen(false);
      router.push("/seller");
    } catch (err) {
      toast.fromApiError("Couldn't pause your shop", err);
      setPausing(false);
    }
  }

  async function handlePermanentDelete() {
    if (deleting || !shop) return;
    setDeleting(true);
    try {
      await deleteShop();
      // Backend flips role to buyer and tombstones the shop. Reflect that
      // locally so the UI doesn't show stale state.
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, role: "buyer" } : s.user,
        activeRole: "buyer",
      }));
      useSellerShopStore.getState().setShop(null);
      toast.confirm(
        "Your shop is closed",
        "Past sales and chats stay accessible. You can open a new shop any time."
      );
      setOpen(false);
      router.push("/feed");
    } catch (err) {
      toast.fromApiError("Couldn't delete your shop", err);
      setDeleting(false);
    }
  }

  if (!shop) return null;

  // Strip the leading @ for comparison — the input prefix already shows it.
  const expectedHandle = shop.handle.replace(/^@/, "");
  const handleMatches = handleInput.trim() === expectedHandle;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
      >
        <Trash2 className="size-4" />
        Delete my shop
      </Button>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="max-w-lg gap-0 p-0">
          {step === "choose" && (
            <ChooseStep
              onPickPause={() => setStep("confirm-pause")}
              onPickDelete={() => setStep("confirm-delete")}
              onCancel={() => handleOpenChange(false)}
            />
          )}
          {step === "confirm-pause" && (
            <ConfirmPauseStep
              shopName={shop.name}
              onBack={() => setStep("choose")}
              onConfirm={handleConfirmPause}
              pausing={pausing}
            />
          )}
          {step === "confirm-delete" && (
            <ConfirmDeleteStep
              shopName={shop.name}
              expectedHandle={expectedHandle}
              handleInput={handleInput}
              onHandleInput={setHandleInput}
              onBack={() => {
                setHandleInput("");
                setStep("choose");
              }}
              onConfirm={handlePermanentDelete}
              canConfirm={handleMatches}
              deleting={deleting}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

interface ChooseStepProps {
  onPickPause: () => void;
  onPickDelete: () => void;
  onCancel: () => void;
}

function ChooseStep({ onPickPause, onPickDelete, onCancel }: ChooseStepProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-7">
      <div className="flex flex-col gap-1">
        <AlertDialogTitle asChild>
          <Typography variant="heading-h2">Step away from selling?</Typography>
        </AlertDialogTitle>
        <Typography variant="body-sm" className="text-muted-foreground">
          Pause for a break, or close your shop for good.
        </Typography>
      </div>

      <div className="flex flex-col gap-3">
        <OptionCard
          icon={<PauseCircle className="size-5" />}
          accent="warning"
          title="Pause my shop"
          description="Hide from new buyers while keeping existing conversations and orders intact. Reopen any time with one click."
          onClick={onPickPause}
        />

        <OptionCard
          icon={<Trash2 className="size-5" />}
          accent="destructive"
          title="Close permanently"
          description="End this shop for good. Past sales, chats, and reviews stay accessible to you. You can open a new shop later — but this one can't be reopened."
          onClick={onPickDelete}
        />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

interface ConfirmPauseStepProps {
  shopName: string;
  onBack: () => void;
  onConfirm: () => void;
  pausing: boolean;
}

function ConfirmPauseStep({
  shopName,
  onBack,
  onConfirm,
  pausing,
}: ConfirmPauseStepProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-7">
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={pausing}
          className="-ml-2 w-fit text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full bg-warning/15 text-warning"
          >
            <PauseCircle className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <AlertDialogTitle asChild>
              <Typography variant="heading-h2">Pause {shopName}?</Typography>
            </AlertDialogTitle>
            <Typography variant="body-sm" className="text-muted-foreground">
              You can reopen any time — nothing is deleted.
            </Typography>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          <Typography variant="label-sm" className="text-muted-foreground">
            What stays working
          </Typography>
          <ul className="flex flex-col gap-1.5">
            <ConsequenceItem safe>
              Existing buyers can still chat, pay, and complete orders
            </ConsequenceItem>
            <ConsequenceItem safe>
              Old conversations, transactions, and reviews stay accessible
            </ConsequenceItem>
            <ConsequenceItem safe>
              Reopen any time — no data is lost
            </ConsequenceItem>
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Typography variant="label-sm" className="text-muted-foreground">
            What stops
          </Typography>
          <ul className="flex flex-col gap-1.5">
            <ConsequenceItem>
              Your shop hides from the feed and search
            </ConsequenceItem>
            <ConsequenceItem>
              New buyers can&apos;t start chats or place orders
            </ConsequenceItem>
          </ul>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={pausing}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="cta"
          size="lg"
          onClick={onConfirm}
          disabled={pausing}
        >
          {pausing && <Loader2 className="size-4 animate-spin" />}
          {pausing ? "Pausing…" : "Pause shop"}
        </Button>
      </div>
    </div>
  );
}

interface OptionCardProps {
  icon: React.ReactNode;
  accent: "warning" | "destructive";
  title: string;
  description: string;
  onClick: () => void;
}

function OptionCard({
  icon,
  accent,
  title,
  description,
  onClick,
}: OptionCardProps) {
  const accentClass =
    accent === "warning"
      ? "bg-warning/15 text-warning"
      : "bg-destructive/15 text-destructive";
  const hoverClass =
    accent === "warning"
      ? "hover:border-warning/40 hover:bg-warning/4"
      : "hover:border-destructive/40 hover:bg-destructive/3";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={`group h-auto items-start gap-4 whitespace-normal rounded-2xl border-border bg-card p-4 text-left transition-colors sm:p-5 ${hoverClass}`}
    >
      <span
        aria-hidden
        className={`grid size-11 shrink-0 place-items-center rounded-full ${accentClass}`}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Typography variant="label-lg">{title}</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          {description}
        </Typography>
      </div>
      <ChevronRight
        aria-hidden
        className="mt-3 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Button>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

interface ConfirmDeleteStepProps {
  shopName: string;
  expectedHandle: string;
  handleInput: string;
  onHandleInput: (value: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
  deleting: boolean;
}

function ConfirmDeleteStep({
  shopName,
  expectedHandle,
  handleInput,
  onHandleInput,
  onBack,
  onConfirm,
  canConfirm,
  deleting,
}: ConfirmDeleteStepProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-7">
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={deleting}
          className="-ml-2 w-fit text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive"
          >
            <Trash2 className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <AlertDialogTitle asChild>
              <Typography variant="heading-h2">Close {shopName}?</Typography>
            </AlertDialogTitle>
            <Typography variant="body-sm" className="text-muted-foreground">
              This can&apos;t be undone.
            </Typography>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          <Typography variant="label-sm" className="text-muted-foreground">
            What happens
          </Typography>
          <ul className="flex flex-col gap-1.5">
            <ConsequenceItem>
              Your shop disappears from the feed and search
            </ConsequenceItem>
            <ConsequenceItem>
              Products are removed from listings
            </ConsequenceItem>
            <ConsequenceItem>
              You can&apos;t reopen this shop — handles can&apos;t be reused
            </ConsequenceItem>
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Typography variant="label-sm" className="text-muted-foreground">
            What stays safe
          </Typography>
          <ul className="flex flex-col gap-1.5">
            <ConsequenceItem safe>
              Past sales, payouts, and order history
            </ConsequenceItem>
            <ConsequenceItem safe>
              Conversations with past buyers
            </ConsequenceItem>
            <ConsequenceItem safe>
              Reviews you&apos;ve received
            </ConsequenceItem>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Typography variant="label-md">
          Type{" "}
          <span className="font-semibold text-foreground">
            @{expectedHandle}
          </span>{" "}
          to confirm
        </Typography>
        <Input
          value={handleInput}
          onChange={(e) => onHandleInput(e.target.value)}
          placeholder={expectedHandle}
          autoFocus
          disabled={deleting}
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="cta"
          size="lg"
          onClick={onConfirm}
          disabled={!canConfirm || deleting}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {deleting && <Loader2 className="size-4 animate-spin" />}
          {deleting ? "Closing your shop…" : "Close shop forever"}
        </Button>
      </div>
    </div>
  );
}

function ConsequenceItem({
  children,
  safe = false,
}: {
  children: React.ReactNode;
  safe?: boolean;
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden
        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
          safe ? "bg-success" : "bg-destructive"
        }`}
      />
      <Typography variant="body-sm" className="text-foreground">
        {children}
      </Typography>
    </li>
  );
}
