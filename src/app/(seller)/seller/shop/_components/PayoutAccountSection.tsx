"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Trash2, Wallet } from "lucide-react";

import { Input } from "@/components/Input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Typography } from "@/components/Typography";
import { extractApiError } from "@/lib/api";
import {
  deleteMyPayoutAccount,
  getBanks,
  getMyPayoutAccount,
  resolveAccount,
  savePayoutAccount,
  type Bank,
  type PayoutAccount,
} from "@/lib/services/payout";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";

const NUBAN_LENGTH = 10;

/**
 * Bank account form on /seller/shop. Reveals the resolved account name
 * after the seller types a valid NUBAN — preventing typo-to-stranger
 * disasters at payout time. Save only enables once the name is resolved.
 *
 * Backend ships the proxy + persist endpoints as part of Phase 7. Banks
 * list, resolve API, and save endpoint all 404-tolerantly degrade so
 * the form mounts cleanly pre-deploy.
 */
export function PayoutAccountSection() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [existing, setExisting] = useState<PayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBanks(), getMyPayoutAccount()])
      .then(([b, a]) => {
        if (cancelled) return;
        setBanks(b);
        setExisting(a);
        if (a) {
          setBankCode(a.bankCode);
          setAccountNumber(a.accountNumber);
          setAccountName(a.accountName);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-resolve once both fields are filled. We wait for a full 10-digit
  // NUBAN before firing — anything less, clear the previously-resolved
  // name so stale state doesn't survive a digit edit. The clear path runs
  // in a microtask via `queueMicrotask` so React 19's "no setState in
  // effect body" rule is satisfied — we're updating state in response to
  // an external event (form change), not synchronously during render.
  useEffect(() => {
    const ready = bankCode && accountNumber.length === NUBAN_LENGTH;
    if (!ready) {
      queueMicrotask(() => {
        setAccountName("");
        setResolveError(null);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setResolving(true);
    });
    resolveAccount(bankCode, accountNumber)
      .then((r) => {
        if (cancelled) return;
        setAccountName(r.accountName);
        setResolveError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          extractApiError(err)?.message ??
          "Couldn't verify that account. Double-check the number.";
        setResolveError(msg);
        setAccountName("");
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bankCode, accountNumber]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await savePayoutAccount({ bankCode, accountNumber });
      setExisting(saved);
      useAuthStore.setState((s) =>
        s.user ? { user: { ...s.user, hasPayoutAccount: true } } : {}
      );
      toast.confirm(
        "Payout account saved",
        "We'll deposit your sales here every morning."
      );
    } catch (err) {
      toast.fromApiError("Couldn't save", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    try {
      await deleteMyPayoutAccount();
      setExisting(null);
      setBankCode("");
      setAccountNumber("");
      setAccountName("");
      useAuthStore.setState((s) =>
        s.user ? { user: { ...s.user, hasPayoutAccount: false } } : {}
      );
      toast.info("Payout account removed", "Add a new one to receive payouts.");
    } catch (err) {
      toast.fromApiError("Couldn't remove", err);
    }
  }

  const canSave = !!bankCode && accountName.length > 0 && !resolving && !saving;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
        >
          <Wallet className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <Typography variant="heading-h4">Payout account</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">
            Where we send your sales. We verify the name with your bank
            before saving.
          </Typography>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <Typography variant="caption">Loading…</Typography>
        </div>
      ) : existing ? (
        <SavedView
          existing={existing}
          banks={banks}
          onRemove={handleRemove}
        />
      ) : (
        <EditorView
          banks={banks}
          bankCode={bankCode}
          accountNumber={accountNumber}
          accountName={accountName}
          resolving={resolving}
          resolveError={resolveError}
          onBankChange={setBankCode}
          onAccountNumberChange={setAccountNumber}
          onSave={handleSave}
          canSave={canSave}
          saving={saving}
        />
      )}
    </section>
  );
}

interface SavedViewProps {
  existing: PayoutAccount;
  banks: Bank[];
  onRemove: () => void;
}

function SavedView({ existing, banks, onRemove }: SavedViewProps) {
  const bankLabel =
    existing.bankName ||
    banks.find((b) => b.code === existing.bankCode)?.name ||
    existing.bankCode;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Typography variant="label-md">{existing.accountName}</Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {bankLabel} · {existing.accountNumber}
        </Typography>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Remove payout account"
          >
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payout account?</AlertDialogTitle>
            <AlertDialogDescription>
              Future payouts will pause until you add a new account. Funds
              already released stay in your owed balance — they&apos;ll
              transfer once you add a new account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface EditorViewProps {
  banks: Bank[];
  bankCode: string;
  accountNumber: string;
  accountName: string;
  resolving: boolean;
  resolveError: string | null;
  onBankChange: (code: string) => void;
  onAccountNumberChange: (n: string) => void;
  onSave: () => void;
  canSave: boolean;
  saving: boolean;
}

function EditorView({
  banks,
  bankCode,
  accountNumber,
  accountName,
  resolving,
  resolveError,
  onBankChange,
  onAccountNumberChange,
  onSave,
  canSave,
  saving,
}: EditorViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col gap-1.5">
        <Typography variant="label-sm" as="span">
          Bank
        </Typography>
        <select
          value={bankCode}
          onChange={(e) => onBankChange(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none scheme-light focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:scheme-dark"
        >
          <option value="" className="bg-background text-foreground">
            Choose your bank…
          </option>
          {banks.map((b) => (
            <option key={b.code} value={b.code} className="bg-background text-foreground">
              {b.name}
            </option>
          ))}
        </select>
        {banks.length === 0 && (
          <Typography variant="caption" className="text-muted-foreground">
            Bank list loading. If it stays empty, refresh in a moment.
          </Typography>
        )}
      </div>

      <Input
        label="Account number"
        placeholder="10-digit NUBAN"
        value={accountNumber}
        onChange={(e) =>
          onAccountNumberChange(
            e.target.value.replace(/\D/g, "").slice(0, NUBAN_LENGTH)
          )
        }
        inputMode="numeric"
        maxLength={NUBAN_LENGTH}
        error={resolveError ?? undefined}
      />

      <div className="flex min-h-9 items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
        {resolving ? (
          <>
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <Typography variant="body-sm" className="text-muted-foreground">
              Verifying with your bank…
            </Typography>
          </>
        ) : accountName ? (
          <>
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            <Typography variant="body-sm">{accountName}</Typography>
          </>
        ) : (
          <Typography variant="body-sm" className="text-muted-foreground">
            Your account name will appear here once verified.
          </Typography>
        )}
      </div>

      <Button
        type="button"
        variant="cta"
        size="lg"
        onClick={onSave}
        disabled={!canSave}
        className="w-fit"
      >
        {saving && <Loader2 className="size-4 animate-spin" />}
        {saving ? "Saving…" : "Save account"}
      </Button>
    </div>
  );
}
