import { ShieldAlert } from "lucide-react";

import { Typography } from "@/components/Typography";

export function WarningBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/15 px-4 py-2 sm:px-6 dark:bg-warning/10">
      <ShieldAlert className="size-4 shrink-0 text-warning dark:text-warning" />
      <Typography variant="caption" className="text-foreground">
        Ahia holds your money safely until you confirm delivery. Pay outside the
        app and you&apos;re on your own.
      </Typography>
    </div>
  );
}
