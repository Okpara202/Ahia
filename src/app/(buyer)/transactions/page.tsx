import { Typography } from "@/components/Typography";
import { getTransactions } from "@/lib/services/transactions";
import { TransactionItem } from "./_components/TransactionItem";

export const metadata = { title: "Transactions — Ahia" };

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  const held = transactions.filter(
    (t) => t.status === "held" || t.status === "partial_released"
  ).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex flex-col gap-1">
        <Typography variant="overline" className="text-primary">
          Purchases
        </Typography>
        <Typography variant="heading-h1">Transactions</Typography>
        {held > 0 && (
          <Typography variant="body-sm" className="text-muted-foreground">
            {held} invoice{held === 1 ? "" : "s"} with funds in escrow —
            confirm items in the chat to release.
          </Typography>
        )}
      </div>

      {transactions.length === 0 ? (
        <Typography variant="body-md" className="text-muted-foreground">
          No transactions yet. Your purchases will show up here.
        </Typography>
      ) : (
        <div className="flex flex-col gap-3">
          {transactions.map((t) => (
            <TransactionItem key={t.id} transaction={t} />
          ))}
        </div>
      )}
    </div>
  );
}
