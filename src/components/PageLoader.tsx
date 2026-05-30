import { LogoMark } from "@/components/Logo";
import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  /** Optional message under the logo. Defaults to no copy — the animation
   *  alone is enough most of the time. Use for first-load gates where you
   *  want to set expectation ("Setting up your shop…"). */
  label?: string;
  /** When true, takes the full viewport (e.g. AuthGate first load). When
   *  false, fills its parent container. Defaults to true. */
  fullScreen?: boolean;
  className?: string;
}

/**
 * Full-screen brand loader. Replaces the bare `<Loader2 />` spinner we used
 * to show during auth gates and first-time shop fetches. Animates the Ahia
 * logo mark with a gentle breathing pulse + an expanding ring — reads as
 * "Ahia is loading", not "your browser is broken."
 *
 * Keep this restrained — too much motion turns a 200ms shell render into a
 * theatrical event. The pulse cycle is 1.6s, slow enough to feel intentional
 * and not draw attention to itself.
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
        "flex flex-col items-center justify-center gap-4 bg-background",
        fullScreen ? "min-h-dvh" : "min-h-[40vh]",
        className
      )}
    >
      <div className="relative grid place-items-center">
        {/* Expanding ring — sits behind the mark, fades in/out as it scales */}
        <span
          aria-hidden
          className="absolute inset-0 -m-2 rounded-xl bg-primary/40 animate-[ahia-ring-pulse_1.6s_ease-in-out_infinite]"
        />
        <span className="relative animate-[ahia-breath_1.6s_ease-in-out_infinite]">
          <LogoMark className="size-12 shadow-lg" />
        </span>
      </div>
      {label && (
        <Typography variant="body-sm" className="text-muted-foreground">
          {label}
        </Typography>
      )}
    </div>
  );
}
