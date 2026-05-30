import { Check, ShieldCheck } from "lucide-react";

import { Typography } from "@/components/Typography";

export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
      <div
        aria-hidden
        className="absolute inset-x-8 inset-y-12 -rotate-6 rounded-[2rem] bg-primary/10 blur-2xl"
      />

      <article className="absolute left-2 top-4 w-[68%] -rotate-3 rounded-2xl border border-border bg-card p-3 shadow-xl">
        <div className="relative h-36 w-full overflow-hidden rounded-xl bg-linear-to-br from-primary/30 via-primary/15 to-accent/20">
          <span className="absolute right-2 top-2 rounded-full bg-card/90 px-2 py-0.5 backdrop-blur">
            <Typography variant="label-sm" className="text-primary">
              Verified
            </Typography>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-3">
          <div className="flex flex-col">
            <Typography variant="heading-h4" className="truncate">
              Nike Air Force 1
            </Typography>
            <Typography variant="caption" className="text-muted-foreground">
              by @sneakerplug.ui
            </Typography>
          </div>
          <Typography variant="price-md" className="text-primary">
            ₦45,000
          </Typography>
        </div>
      </article>

      <div className="absolute right-2 top-32 flex w-[52%] flex-col gap-2">
        <ChatBubble side="them">Is the size 42 still available?</ChatBubble>
        <ChatBubble side="me">Yes, brand new. ₦45k.</ChatBubble>
      </div>

      <article className="absolute bottom-2 left-6 w-[78%] rotate-2 rounded-2xl border border-border bg-card p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-success/15 text-success">
            <Check className="size-5" strokeWidth={3} />
          </span>
          <div className="flex flex-col">
            <Typography variant="label-md">Payment held in escrow</Typography>
            <Typography variant="caption" className="text-muted-foreground">
              Released when you confirm delivery
            </Typography>
          </div>
          <Typography
            variant="price-md"
            className="ml-auto whitespace-nowrap text-foreground"
          >
            ₦45,000
          </Typography>
        </div>
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5">
          <ShieldCheck className="size-3.5 shrink-0 text-primary" />
          <Typography variant="caption" className="text-primary">
            Protected by Ahia
          </Typography>
        </div>
      </article>
    </div>
  );
}

function ChatBubble({
  side,
  children,
}: {
  side: "me" | "them";
  children: React.ReactNode;
}) {
  const mine = side === "me";
  return (
    <div
      className={[
        "max-w-[85%] rounded-2xl border px-3 py-2 shadow-md",
        mine
          ? "ml-auto rounded-br-md border-primary/20 bg-primary text-primary-foreground"
          : "rounded-bl-md border-border bg-card",
      ].join(" ")}
    >
      <Typography variant="body-sm" className={mine ? "text-primary-foreground" : ""}>
        {children}
      </Typography>
    </div>
  );
}
