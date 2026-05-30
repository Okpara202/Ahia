import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const typographyVariants = cva("", {
  variants: {
    variant: {
      "display-lg":
        "font-heading text-4xl md:text-[56px] font-bold leading-[1.05] tracking-tight",
      "display-md":
        "font-heading text-3xl md:text-[44px] font-bold leading-[1.1] tracking-tight",
      "heading-h1":
        "font-heading text-[26px] md:text-4xl font-bold leading-[1.15] tracking-tight",
      "heading-h2":
        "font-heading text-[22px] md:text-[28px] font-semibold leading-[1.2] tracking-tight",
      "heading-h3":
        "font-heading text-lg md:text-[22px] font-semibold leading-[1.3]",
      "heading-h4":
        "font-heading text-base md:text-lg font-semibold leading-[1.4]",
      "body-lg": "font-sans text-base md:text-lg font-normal leading-[1.6]",
      "body-md": "font-sans text-[15px] md:text-base font-normal leading-[1.6]",
      "body-sm": "font-sans text-[13px] md:text-sm font-normal leading-[1.5]",
      "label-lg": "font-sans text-[15px] font-medium leading-snug",
      "label-md": "font-sans text-[13px] font-medium leading-snug",
      "label-sm":
        "font-sans text-[11px] font-semibold leading-snug tracking-wide",
      caption: "font-sans text-xs font-normal leading-snug",
      overline:
        "font-sans text-[11px] font-bold uppercase leading-snug tracking-[0.08em]",
      "price-lg":
        "font-mono text-[22px] md:text-[26px] font-bold leading-tight tabular-nums",
      "price-md":
        "font-mono text-base md:text-lg font-bold leading-tight tabular-nums",
      "price-sm":
        "font-mono text-[13px] md:text-sm font-semibold leading-tight tabular-nums",
    },
  },
  defaultVariants: {
    variant: "body-md",
  },
});

export type TypographyVariant = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>;

const variantToElement: Record<TypographyVariant, React.ElementType> = {
  "display-lg": "h1",
  "display-md": "h1",
  "heading-h1": "h1",
  "heading-h2": "h2",
  "heading-h3": "h3",
  "heading-h4": "h4",
  "body-lg": "p",
  "body-md": "p",
  "body-sm": "p",
  "label-lg": "span",
  "label-md": "span",
  "label-sm": "span",
  caption: "span",
  overline: "span",
  "price-lg": "span",
  "price-md": "span",
  "price-sm": "span",
};

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  variant?: TypographyVariant;
  as?: React.ElementType;
  children?: React.ReactNode;
}

export function Typography({
  variant = "body-md",
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  const Component = as ?? variantToElement[variant];
  return (
    <Component
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
