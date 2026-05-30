import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** "mark" = icon only, "full" = icon + wordmark, "wordmark" = text only. */
  variant?: "mark" | "full" | "wordmark";
  /** Tailwind size class for the mark, e.g. "size-8" (default). */
  markSize?: string;
  /** Inverted color (use when placed on a primary-coloured background). */
  inverted?: boolean;
}

export function Logo({
  className,
  variant = "full",
  markSize = "size-8",
  inverted = false,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {variant !== "wordmark" && (
        <LogoMark className={markSize} inverted={inverted} />
      )}
      {variant !== "mark" && (
        <Typography variant="heading-h4" className="tracking-tight">
          ahia
        </Typography>
      )}
    </span>
  );
}

interface LogoMarkProps {
  className?: string;
  inverted?: boolean;
}

export function LogoMark({ className, inverted = false }: LogoMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid place-items-center rounded-lg",
        inverted
          ? "bg-primary-foreground text-primary"
          : "bg-primary text-primary-foreground",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[58%]"
      >
        {/* Stylised A: two ascending strokes, an angled crossbar that doubles
            as a horizon line — hints at a marketplace marker without being
            literal. */}
        <path d="M5 19 L12 5 L19 19" />
        <path d="M8.5 13.5 L15.5 13.5" />
      </svg>
      {/* Accent dot — signals "live commerce", brand differentiator. */}
      <span
        aria-hidden
        className={cn(
          "absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-accent",
          inverted ? "ring-2 ring-primary" : "ring-2 ring-background"
        )}
      />
    </span>
  );
}
