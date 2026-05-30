import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BadgeCheck } from "lucide-react";

import { Typography } from "@/components/Typography";
import { formatNaira } from "@/lib/format";
import type { Conversation } from "@/types";

export type ChatPerspective = "buyer" | "seller";

interface ChatHeaderProps {
  conversation: Conversation;
  perspective: ChatPerspective;
  inboxHref: string;
}

export function ChatHeader({
  conversation,
  perspective,
  inboxHref,
}: ChatHeaderProps) {
  const { product } = conversation;
  const counterparty =
    perspective === "buyer" ? conversation.seller : conversation.buyer;
  const counterpartyHref =
    perspective === "buyer" ? `/shops/${counterparty.id}` : null;

  const NameBlock = (
    <>
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
      >
        <Typography variant="label-md" className="font-bold">
          {counterparty.name.charAt(0)}
        </Typography>
      </span>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-1">
          <Typography variant="label-lg" className="truncate">
            {counterparty.name}
          </Typography>
          {counterparty.verified && (
            <BadgeCheck className="size-3.5 shrink-0 text-primary" />
          )}
        </div>
        <Typography
          variant="caption"
          className="truncate text-muted-foreground"
        >
          {counterparty.handle}
        </Typography>
      </div>
    </>
  );

  return (
    <header className="flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <Link
        href={inboxHref}
        aria-label="Back to inbox"
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
      </Link>

      {counterpartyHref ? (
        <Link
          href={counterpartyHref}
          className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
        >
          {NameBlock}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {NameBlock}
        </div>
      )}

      <Link
        href={`/products/${product.id}`}
        className="hidden items-center gap-2 rounded-xl border border-border bg-card p-1.5 pr-3 transition-colors hover:border-primary/40 sm:flex"
      >
        <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-muted">
          {product.media.type === "image" ? (
            <Image
              src={product.media.url}
              alt={product.name}
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            <Image
              src={product.media.poster ?? ""}
              alt={product.name}
              fill
              sizes="36px"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <Typography variant="caption" className="line-clamp-1">
            {product.name}
          </Typography>
          <Typography variant="price-sm" className="text-primary">
            {formatNaira(product.price)}
          </Typography>
        </div>
      </Link>
    </header>
  );
}
