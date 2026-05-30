import { Suspense } from "react";

import { Typography } from "@/components/Typography";
import { PaystackReturn } from "./_components/PaystackReturn";

export const metadata = { title: "Confirming payment — Ahia" };

export default function PaystackReturnPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10">
      <Suspense
        fallback={
          <Typography variant="body-md" className="text-muted-foreground">
            Loading…
          </Typography>
        }
      >
        <PaystackReturn />
      </Suspense>
    </div>
  );
}
