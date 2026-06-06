import { Suspense } from "react";

import { Typography } from "@/components/Typography";
import { AccountSuspended } from "./_components/AccountSuspended";

export const metadata = { title: "Account suspended — Ahia" };

export default function AccountSuspendedPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10">
      <Suspense
        fallback={
          <Typography variant="body-md" className="text-muted-foreground">
            Loading…
          </Typography>
        }
      >
        <AccountSuspended />
      </Suspense>
    </div>
  );
}
