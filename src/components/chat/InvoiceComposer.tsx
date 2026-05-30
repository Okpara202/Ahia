"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import Image from "next/image";
import {
  FileText,
  Loader2,
  Minus,
  Package,
  Percent,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { Input } from "@/components/Input";
import { Portal } from "@/components/Portal";
import { Typography } from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { extractApiError } from "@/lib/api";
import { sendInvoiceMessage } from "@/lib/services/conversations";
import type { InvoiceLineDraft } from "@/lib/services/conversations";
import { getMyProducts } from "@/lib/services/seller";
import { cn } from "@/lib/utils";
import { useSellerShopStore } from "@/store/sellerShopStore";
import { toast } from "@/store/toastStore";
import type { Message, Product } from "@/types";

interface InvoiceComposerProps {
  open: boolean;
  conversationId: string;
  onClose: () => void;
  /** Called with the persisted invoice message after backend echoes. */
  onSent: (message: Message) => void;
}

interface DraftLine {
  /** Stable local id for React keys + remove handler. */
  uid: string;
  kind: "product" | "custom" | "discount";
  productId?: string;
  productCoverUrl?: string;
  name: string;
  /** Always positive in the draft. Discounts are signed only when sending. */
  unitPriceMinor: number;
  quantity: number;
}

type PanelMode = "list" | "product-picker" | "custom" | "discount";

function genUid(): string {
  return `${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
}

function formatNaira(minor: number): string {
  return `₦${minor.toLocaleString("en-NG")}`;
}

export function InvoiceComposer({
  open,
  conversationId,
  onClose,
  onSent,
}: InvoiceComposerProps) {
  const shop = useSellerShopStore((s) => s.shop);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [panel, setPanel] = useState<PanelMode>("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLines([]);
      setPanel("list");
      setProductQuery("");
      setCustomName("");
      setCustomAmount("");
      setSending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Lazy-load the seller's products the first time the picker opens.
  useEffect(() => {
    if (panel !== "product-picker") return;
    if (products.length > 0) return;
    if (!shop?.id) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProductsLoading(true);
    getMyProducts(shop.id)
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [panel, products.length, shop?.id]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productQuery]);

  const subtotal = useMemo(
    () =>
      lines
        .filter((l) => l.kind !== "discount")
        .reduce((sum, l) => sum + l.unitPriceMinor * l.quantity, 0),
    [lines]
  );
  const discounts = useMemo(
    () =>
      lines
        .filter((l) => l.kind === "discount")
        .reduce((sum, l) => sum + l.unitPriceMinor * l.quantity, 0),
    [lines]
  );
  const total = Math.max(0, subtotal - discounts);
  const hasChargeableLine = lines.some((l) => l.kind !== "discount");
  const canSend = hasChargeableLine && total > 0 && !sending;

  function addProduct(p: Product) {
    if (lines.some((l) => l.productId === p.id)) {
      toast.info("Already added", "That product is on the invoice already.");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        uid: genUid(),
        kind: "product",
        productId: p.id,
        productCoverUrl: p.media.url || undefined,
        name: p.name,
        unitPriceMinor: Math.round(p.price),
        quantity: 1,
      },
    ]);
    setPanel("list");
    setProductQuery("");
  }

  function addCustomLine(kind: "custom" | "discount") {
    const trimmed = customName.trim();
    const minor = Math.round(Number(customAmount) || 0);
    if (!trimmed) {
      toast.error("Add a name", "Give this line a short description.");
      return;
    }
    if (minor <= 0) {
      toast.error("Add an amount", "Enter a positive amount in Naira.");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        uid: genUid(),
        kind,
        name: trimmed,
        unitPriceMinor: minor,
        quantity: 1,
      },
    ]);
    setCustomName("");
    setCustomAmount("");
    setPanel("list");
  }

  function removeLine(uid: string) {
    setLines((prev) => prev.filter((l) => l.uid !== uid));
  }

  function adjustQty(uid: string, delta: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.uid === uid
          ? { ...l, quantity: Math.max(1, Math.min(99, l.quantity + delta)) }
          : l
      )
    );
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    // Backend snapshots `name` and `unitPrice` for product lines from the
    // products table at send time — we only forward productId + quantity.
    const payload: InvoiceLineDraft[] = lines.map((l): InvoiceLineDraft => {
      if (l.kind === "product") {
        return {
          kind: "product",
          productId: l.productId as string,
          quantity: l.quantity,
        };
      }
      if (l.kind === "discount") {
        return {
          kind: "discount",
          name: l.name,
          unitPrice: -l.unitPriceMinor,
          quantity: l.quantity,
        };
      }
      return {
        kind: "custom",
        name: l.name,
        unitPrice: l.unitPriceMinor,
        quantity: l.quantity,
      };
    });
    try {
      const message = await sendInvoiceMessage(conversationId, payload);
      onSent(message);
      onClose();
    } catch (err) {
      const apiErr = extractApiError(err);
      toast.error(
        "Couldn't send invoice",
        apiErr?.message ??
          "Backend may not have shipped invoice endpoints yet — see FRONTEND_ASK_invoice.md."
      );
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:max-h-[82dvh]">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-4" />
            </span>
            <div className="flex flex-col">
              <Typography variant="heading-h3">
                {panel === "product-picker"
                  ? "Pick a product"
                  : panel === "custom"
                  ? "Add a custom line"
                  : panel === "discount"
                  ? "Add a discount"
                  : "New invoice"}
              </Typography>
              <Typography
                variant="caption"
                className="text-muted-foreground"
              >
                {panel === "list"
                  ? lines.length === 0
                    ? "Add lines below"
                    : `${lines.length} line${lines.length === 1 ? "" : "s"} · ${formatNaira(
                        total
                      )}`
                  : "Back to invoice when done"}
              </Typography>
            </div>
          </div>
          <button
            type="button"
            onClick={panel === "list" ? onClose : () => setPanel("list")}
            aria-label={panel === "list" ? "Close" : "Back"}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {panel === "list" && (
            <LinesView
              lines={lines}
              onRemove={removeLine}
              onAdjust={adjustQty}
              onOpenProductPicker={() => setPanel("product-picker")}
              onOpenCustom={() => setPanel("custom")}
              onOpenDiscount={() => setPanel("discount")}
            />
          )}
          {panel === "product-picker" && (
            <ProductPicker
              query={productQuery}
              onQueryChange={setProductQuery}
              loading={productsLoading}
              products={filteredProducts}
              alreadyAdded={new Set(
                lines
                  .filter((l) => l.productId)
                  .map((l) => l.productId as string)
              )}
              onPick={addProduct}
            />
          )}
          {panel === "custom" && (
            <CustomLineForm
              kind="custom"
              name={customName}
              amount={customAmount}
              onName={setCustomName}
              onAmount={setCustomAmount}
              onAdd={() => addCustomLine("custom")}
            />
          )}
          {panel === "discount" && (
            <CustomLineForm
              kind="discount"
              name={customName}
              amount={customAmount}
              onName={setCustomName}
              onAmount={setCustomAmount}
              onAdd={() => addCustomLine("discount")}
            />
          )}
        </div>

        {/* Footer */}
        {panel === "list" && (
          <div className="flex flex-col gap-3 border-t border-border bg-card px-5 py-4 sm:px-6">
            {lines.length > 0 && (
              <div className="flex flex-col gap-1 rounded-xl bg-muted/40 px-3 py-2.5">
                <SummaryRow label="Subtotal" value={formatNaira(subtotal)} />
                {discounts > 0 && (
                  <SummaryRow
                    label="Discounts"
                    value={`−${formatNaira(discounts)}`}
                    accent="muted"
                  />
                )}
                <div className="mt-1 border-t border-border pt-1.5">
                  <SummaryRow
                    label="Total"
                    value={formatNaira(total)}
                    accent="strong"
                  />
                </div>
              </div>
            )}
            <Button
              onClick={handleSend}
              variant="cta"
              size="lg"
              disabled={!canSend}
            >
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                `Send invoice · ${formatNaira(total)}`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
    </Portal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

interface LinesViewProps {
  lines: DraftLine[];
  onRemove: (uid: string) => void;
  onAdjust: (uid: string, delta: number) => void;
  onOpenProductPicker: () => void;
  onOpenCustom: () => void;
  onOpenDiscount: () => void;
}

function LinesView({
  lines,
  onRemove,
  onAdjust,
  onOpenProductPicker,
  onOpenCustom,
  onOpenDiscount,
}: LinesViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-card text-primary">
            <Sparkles className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <Typography variant="label-lg">Start an invoice</Typography>
            <Typography
              variant="caption"
              className="text-muted-foreground"
            >
              Add a product from your shop, a custom line, or a discount.
            </Typography>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {lines.map((line) => (
            <LineRow
              key={line.uid}
              line={line}
              onRemove={onRemove}
              onAdjust={onAdjust}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <AddLineButton
          icon={<Package className="size-4" />}
          label="Add product"
          hint="From your shop"
          onClick={onOpenProductPicker}
        />
        <AddLineButton
          icon={<Plus className="size-4" />}
          label="Custom line"
          hint="Delivery, service, anything else"
          onClick={onOpenCustom}
        />
        <AddLineButton
          icon={<Percent className="size-4" />}
          label="Discount"
          hint="Knock something off the total"
          onClick={onOpenDiscount}
          tone="accent"
        />
      </div>
    </div>
  );
}

interface LineRowProps {
  line: DraftLine;
  onRemove: (uid: string) => void;
  onAdjust: (uid: string, delta: number) => void;
}

function LineRow({ line, onRemove, onAdjust }: LineRowProps) {
  const isDiscount = line.kind === "discount";
  const total = line.unitPriceMinor * line.quantity;
  return (
    <li className="flex items-stretch gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
        {line.productCoverUrl ? (
          <Image
            src={line.productCoverUrl}
            alt={line.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : isDiscount ? (
          <Percent className="size-5 text-accent" />
        ) : (
          <Sparkles className="size-5" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <Typography variant="label-md" className="line-clamp-1">
          {line.name}
        </Typography>
        <div className="flex items-center gap-2">
          <Typography
            variant="caption"
            className={cn(
              "font-mono tabular-nums",
              isDiscount ? "text-accent" : "text-muted-foreground"
            )}
          >
            {isDiscount ? "−" : ""}
            {formatNaira(line.unitPriceMinor)}
            {line.quantity > 1 && ` × ${line.quantity}`}
          </Typography>
          {!isDiscount && (
            <div className="ml-auto flex items-center gap-1">
              <QtyButton
                aria-label="Decrease quantity"
                onClick={() => onAdjust(line.uid, -1)}
                disabled={line.quantity <= 1}
              >
                <Minus className="size-3" />
              </QtyButton>
              <Typography
                variant="label-sm"
                className="min-w-5 text-center font-mono tabular-nums"
              >
                {line.quantity}
              </Typography>
              <QtyButton
                aria-label="Increase quantity"
                onClick={() => onAdjust(line.uid, 1)}
                disabled={line.quantity >= 99}
              >
                <Plus className="size-3" />
              </QtyButton>
            </div>
          )}
        </div>
        {!isDiscount && line.quantity > 1 && (
          <Typography
            variant="caption"
            className="font-mono tabular-nums text-foreground"
          >
            Subtotal {formatNaira(total)}
          </Typography>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(line.uid)}
        aria-label="Remove line"
        className="grid size-8 shrink-0 place-items-center self-start rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

function QtyButton({
  children,
  disabled,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid size-7 place-items-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      {...rest}
    >
      {children}
    </button>
  );
}

interface AddLineButtonProps {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  tone?: "primary" | "accent";
}

function AddLineButton({
  icon,
  label,
  hint,
  onClick,
  tone = "primary",
}: AddLineButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          tone === "accent"
            ? "bg-accent/10 text-accent"
            : "bg-primary/10 text-primary"
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <Typography variant="label-md">{label}</Typography>
        <Typography variant="caption" className="text-muted-foreground">
          {hint}
        </Typography>
      </div>
      <Plus className="size-4 text-muted-foreground" />
    </button>
  );
}

interface ProductPickerProps {
  query: string;
  onQueryChange: (q: string) => void;
  loading: boolean;
  products: Product[];
  alreadyAdded: Set<string>;
  onPick: (p: Product) => void;
}

function ProductPicker({
  query,
  onQueryChange,
  loading,
  products,
  alreadyAdded,
  onPick,
}: ProductPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search your products…"
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onQueryChange(e.target.value)
          }
          className="flex h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-input/30"
        />
      </div>
      {loading ? (
        <div className="grid place-items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <Typography variant="caption">Loading your products…</Typography>
        </div>
      ) : products.length === 0 ? (
        <div className="grid place-items-center gap-2 py-10 text-center">
          <Typography variant="label-md">No products found</Typography>
          <Typography variant="caption" className="text-muted-foreground">
            {query.trim()
              ? "Try a different search."
              : "Add a product to your shop first, or use a custom line."}
          </Typography>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {products.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                disabled={alreadyAdded.has(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-card"
              >
                <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                  {p.media.url ? (
                    <Image
                      src={p.media.url}
                      alt={p.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <Package className="size-5" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Typography variant="label-md" className="line-clamp-1">
                    {p.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="font-mono tabular-nums text-muted-foreground"
                  >
                    {formatNaira(Math.round(p.price))}
                  </Typography>
                </div>
                {alreadyAdded.has(p.id) ? (
                  <Typography
                    variant="caption"
                    className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-primary"
                  >
                    Added
                  </Typography>
                ) : (
                  <Plus className="size-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CustomLineFormProps {
  kind: "custom" | "discount";
  name: string;
  amount: string;
  onName: (v: string) => void;
  onAmount: (v: string) => void;
  onAdd: () => void;
}

function CustomLineForm({
  kind,
  name,
  amount,
  onName,
  onAmount,
  onAdd,
}: CustomLineFormProps) {
  const isDiscount = kind === "discount";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            isDiscount
              ? "bg-accent/10 text-accent"
              : "bg-primary/10 text-primary"
          )}
        >
          {isDiscount ? (
            <Percent className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
        </span>
        <div className="flex min-w-0 flex-col">
          <Typography variant="label-md">
            {isDiscount ? "Discount" : "Custom line"}
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            {isDiscount
              ? "Subtracted from the total"
              : "Anything not in your product catalog"}
          </Typography>
        </div>
      </div>

      <Input
        label="Description"
        placeholder={
          isDiscount ? "First-time buyer" : "Express delivery to Yaba"
        }
        value={name}
        onChange={(e) => onName(e.target.value)}
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5">
          <Typography variant="label-sm">Amount (₦)</Typography>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₦
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={amount}
              onChange={(e) => onAmount(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-card pl-7 pr-3 font-mono text-sm tabular-nums outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-input/30"
            />
          </div>
        </label>
        {isDiscount && (
          <Typography variant="caption" className="text-muted-foreground">
            Enter as a positive number — we&apos;ll subtract it from the total.
          </Typography>
        )}
      </div>

      <Button onClick={onAdd} variant="cta" size="lg">
        {isDiscount ? "Add discount" : "Add line"}
      </Button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent = "normal",
}: {
  label: string;
  value: string;
  accent?: "normal" | "muted" | "strong";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Typography
        variant={accent === "strong" ? "label-md" : "caption"}
        className={
          accent === "muted"
            ? "text-muted-foreground"
            : accent === "strong"
            ? ""
            : "text-muted-foreground"
        }
      >
        {label}
      </Typography>
      <Typography
        variant={accent === "strong" ? "label-lg" : "label-sm"}
        className={cn(
          "font-mono tabular-nums",
          accent === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </Typography>
    </div>
  );
}
