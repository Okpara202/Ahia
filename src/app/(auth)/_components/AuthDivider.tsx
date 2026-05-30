import { Typography } from "@/components/Typography";

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 bg-border" />
      <Typography variant="caption" className="uppercase tracking-wider text-muted-foreground">
        {label}
      </Typography>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}
