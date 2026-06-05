import { LogoMark } from "@/components/Logo";
import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  /** Optional message under the logo. Defaults to no copy — the animation
   *  alone is enough most of the time. Use for first-load gates where you
   *  want to set expectation ("Setting up your shop…"). */
  label?: string;
  /** When true, takes the full viewport (e.g. AuthGate first load). When
   *  false, fills its parent container with a generous min-height so the
   *  mark sits closer to the visual center. Defaults to true. */
  fullScreen?: boolean;
  className?: string;
}

/**
 * Brand loader. Replaces the bare `<Loader2 />` spinner we used to show
 * during auth gates and first-time shop fetches. Animates the Ahia logo
 * mark with a gentle breathing pulse + an expanding ring — reads as
 * "Ahia is loading", not "your browser is broken."
 *
 * The mark is intentionally large so the loader feels like a real
 * brand moment, not a generic spinner. Non-fullscreen uses take a
 * generous min-height so the centered mark doesn't read as "stuck at
 * the top of the page."
 */
export function PageLoader({
  label,
  fullScreen = true,
  className,
}: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-label={label ?? "Loading"}
      className={cn(
        "flex flex-col items-center justify-center gap-5 bg-background",
        fullScreen ? "min-h-dvh" : "min-h-[70vh]",
        className
      )}
    >
      <div className="relative grid place-items-center">
        {/* Expanding ring — sits behind the mark, fades in/out as it scales */}
        <span
          aria-hidden
          className="absolute inset-0 -m-3 rounded-2xl bg-primary/40 animate-[ahia-ring-pulse_1.6s_ease-in-out_infinite]"
        />
        <span className="relative animate-[ahia-breath_1.6s_ease-in-out_infinite]">
          <LogoMark className="size-20 shadow-xl sm:size-24" />
        </span>
      </div>
      {label && (
        <Typography variant="body-md" className="text-muted-foreground">
          {label}
        </Typography>
      )}
    </div>
  );
}
