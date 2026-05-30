/**
 * Line-art empty-state illustrations. Use `currentColor` so they tint via
 * Tailwind text utilities (e.g. wrap in `text-primary/40` for a subtle look).
 */

interface IllustrationProps {
  className?: string;
}

const BASE_PROPS = {
  viewBox: "0 0 120 120",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function EmptyInboxIllustration({ className }: IllustrationProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden>
      <path d="M22 56h76v34a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8z" />
      <path d="M22 56l13-22a8 8 0 0 1 7-4h36a8 8 0 0 1 7 4l13 22" />
      <path d="M22 56h22l5 10h22l5-10h22" />
      <circle cx="60" cy="32" r="3" />
      <path d="M52 26l-4-6M68 26l4-6" />
    </svg>
  );
}

export function EmptyProductsIllustration({ className }: IllustrationProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden>
      <path d="M30 44l30-14 30 14v36L60 94 30 80z" />
      <path d="M30 44l30 14 30-14M60 58v36" />
      <circle cx="60" cy="68" r="3" />
      <path d="M60 74v6" />
    </svg>
  );
}

export function EmptyNotificationsIllustration({ className }: IllustrationProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden>
      <path d="M40 76V58a20 20 0 0 1 40 0v18l6 8H34z" />
      <path d="M54 92a6 6 0 0 0 12 0" />
      <path d="M82 30l8-6M90 38h8M30 38h-8M38 30l-8-6" />
    </svg>
  );
}

export function EmptySearchIllustration({ className }: IllustrationProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden>
      <circle cx="52" cy="52" r="24" />
      <path d="M70 70l20 20" />
      <path d="M46 46l12 12M58 46l-12 12" />
    </svg>
  );
}

export function EmptyTransactionsIllustration({ className }: IllustrationProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden>
      <path d="M24 40h72a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V44a4 4 0 0 1 4-4z" />
      <path d="M20 54h80" />
      <path d="M32 72h14M56 72h6" />
      <circle cx="84" cy="48" r="2" />
    </svg>
  );
}
