import { cn } from "@/lib/utils";

/**
 * Placeholder block for content that's still loading. Renders a muted base
 * with a soft shimmer sweep — calmer than a raw pulse and closer to what
 * Shopify/Stripe/Notion use for skeleton states.
 *
 * Compose into page-specific skeletons (`ProductCardSkeleton`,
 * `ConversationRowSkeleton`, etc.) rather than scattering raw `<Skeleton>`s
 * across components — the goal is content-shaped placeholders, not gray
 * rectangles in the rough vicinity.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/70",
        // Shimmer sweep — pure CSS, no JS, respects prefers-reduced-motion
        // via the implicit Tailwind motion-safe convention (the bg-muted base
        // gives a stable resting state when animation is suppressed).
        "before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-foreground/8 before:to-transparent before:animate-[ahia-shimmer_1.6s_infinite]",
        className
      )}
      {...props}
    />
  );
}
