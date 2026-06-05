"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Loader2,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

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
import { cn } from "@/lib/utils";
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
        // Paystack's bank list legitimately contains duplicate `code`
        // values — multiple OPay / fintech subsidiaries share the same
        // NIBSS sort code. Dedupe by code (keep first) so React keys are
        // unique AND the dropdown isn't visually confusing for sellers.
        const seen = new Set<string>();
        const deduped: Bank[] = [];
        for (const bank of b) {
          if (seen.has(bank.code)) continue;
          seen.add(bank.code);
          deduped.push(bank);
        }
        setBanks(deduped);
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
        if (!r.accountName) {
          // Backend returned 200 but no name — treat as verification failure
          // so the seller doesn't end up saving a blank.
          setResolveError(
            "Bank didn't return a name for that number. Double-check the digits."
          );
          setAccountName("");
          return;
        }
        setAccountName(r.accountName);
        setResolveError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        const apiErr = extractApiError(err);
        // Surface details to the console — verification regressions are
        // hard to diagnose without seeing the actual backend response.
        console.warn("[payout-resolve] failed", {
          bankCode,
          status:
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { status?: number } }).response?.status
              : undefined,
          apiErr,
        });
        const baseMsg =
          apiErr?.message ??
          "Couldn't verify that account. Double-check the number.";
        const msg = apiErr?.requestId
          ? `${baseMsg} (ID: ${apiErr.requestId})`
          : baseMsg;
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
        <BankPicker
          banks={banks}
          value={bankCode}
          onChange={onBankChange}
        />
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

interface BankPickerProps {
  banks: Bank[];
  value: string;
  onChange: (code: string) => void;
}

/**
 * Searchable bank dropdown. Native `<select>` is dreadful UX with ~30+
 * Nigerian banks — sellers scroll forever. This shows a trigger button
 * with the selected name, opens a panel with a search input + filtered
 * list, and closes on selection or click-outside.
 */
function BankPicker({ banks, value, onChange }: BankPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = banks.find((b) => b.code === value);

  // Close on click outside the picker.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Auto-focus the search input on open.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, query]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={banks.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
          banks.length === 0 && "cursor-not-allowed opacity-60"
        )}
      >
        <span
          className={cn(
            "truncate",
            !selected && "text-muted-foreground"
          )}
        >
          {selected?.name ?? "Choose your bank…"}
        </span>
        <ChevronsUpDown
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search aria-hidden className="size-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search banks…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <Typography variant="caption" className="text-muted-foreground">
                No banks match &ldquo;{query}&rdquo;.
              </Typography>
            </div>
          ) : (
            <ul
              role="listbox"
              className="max-h-64 overflow-y-auto py-1"
            >
              {filtered.map((b) => {
                const active = b.code === value;
                return (
                  <li key={b.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(b.code);
                        setQuery("");
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        active && "bg-primary/8 text-primary"
                      )}
                    >
                      <Check
                        aria-hidden
                        className={cn(
                          "size-3.5 shrink-0",
                          active ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{b.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
