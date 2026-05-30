"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { FileText, Mic } from "lucide-react";

import { Typography } from "@/components/Typography";
import type { Message, MessageContextProduct } from "@/types";
import { ImageMessageCard } from "./ImageMessageCard";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        {messages.map((message, i) => {
          const mine = message.senderId === currentUserId;
          const next = messages[i + 1];
          const showTime =
            !next ||
            next.senderId !== message.senderId ||
            next.type !== message.type;

          if (message.type === "system") {
            return (
              <div key={message.id} className="my-2 flex justify-center">
                <Typography
                  variant="caption"
                  className="rounded-full bg-muted px-3 py-1 text-muted-foreground"
                >
                  {message.content}
                </Typography>
              </div>
            );
          }

          if (message.type === "image") {
            return (
              <div key={message.id} className="flex flex-col gap-1">
                {message.contextProduct && (
                  <ContextProductChip
                    product={message.contextProduct}
                    mine={mine}
                  />
                )}
                <ImageMessageCard message={message} mine={mine} />
              </div>
            );
          }

          if (message.type === "voice") {
            // Placeholder rendering — Phase 2 builds the real waveform +
            // play/pause + speed-toggle player. For now, render a quiet card
            // so the thread doesn't break when a voice note is in history.
            return (
              <VoicePlaceholder
                key={message.id}
                durationMs={message.voiceDurationMs}
                mine={mine}
                contextProduct={message.contextProduct}
              />
            );
          }

          if (message.type === "invoice") {
            // Placeholder for Phase 2 — full invoice card (per-line confirm,
            // dispute, pay button) lands then. For now, show a quiet
            // summary that links to nothing.
            return (
              <InvoicePlaceholder
                key={message.id}
                total={message.invoice.totalAmount}
                status={message.invoice.status}
                lineCount={message.invoice.lines.length}
                mine={mine}
              />
            );
          }

          // text
          return (
            <div key={message.id} className="flex flex-col gap-1">
              {message.contextProduct && (
                <ContextProductChip
                  product={message.contextProduct}
                  mine={mine}
                />
              )}
              <MessageBubble
                message={message}
                mine={mine}
                showTime={showTime}
              />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}

interface ContextProductChipProps {
  product: MessageContextProduct;
  mine: boolean;
}

function ContextProductChip({ product, mine }: ContextProductChipProps) {
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div className="flex max-w-[85%] items-center gap-2 rounded-lg border-l-4 border-primary/60 bg-card/60 py-1.5 pl-2 pr-3 sm:max-w-[70%]">
        {product.coverUrl ? (
          <div className="relative size-8 shrink-0 overflow-hidden rounded">
            <Image
              src={product.coverUrl}
              alt={product.name}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col">
          <Typography variant="caption" className="text-primary">
            Asking about
          </Typography>
          <Typography variant="label-sm" className="truncate">
            {product.name}
          </Typography>
        </div>
      </div>
    </div>
  );
}

function VoicePlaceholder({
  durationMs,
  mine,
  contextProduct,
}: {
  durationMs: number;
  mine: boolean;
  contextProduct: MessageContextProduct | null;
}) {
  const seconds = Math.round(durationMs / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const dur = `${m}:${s.toString().padStart(2, "0")}`;
  return (
    <div className={mine ? "flex flex-col items-end gap-1" : "flex flex-col items-start gap-1"}>
      {contextProduct && (
        <ContextProductChip product={contextProduct} mine={mine} />
      )}
      <div
        className={
          "flex items-center gap-2 rounded-2xl bg-card px-3 py-2 text-foreground"
        }
      >
        <Mic className="size-4 text-primary" />
        <Typography variant="body-sm">Voice note · {dur}</Typography>
      </div>
      <Typography variant="caption" className="px-1 text-muted-foreground">
        Player coming soon
      </Typography>
    </div>
  );
}

function InvoicePlaceholder({
  total,
  status,
  lineCount,
  mine,
}: {
  total: string;
  status: string;
  lineCount: number;
  mine: boolean;
}) {
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div className="flex max-w-[85%] items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 sm:max-w-[70%]">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <FileText className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <Typography variant="label-sm" className="text-primary">
            Invoice · {status.replace("_", " ")}
          </Typography>
          <Typography variant="label-lg">
            ₦{Number(total).toLocaleString("en-NG")}
          </Typography>
          <Typography
            variant="caption"
            className="text-muted-foreground"
          >
            {lineCount} item{lineCount === 1 ? "" : "s"} · full card coming soon
          </Typography>
        </div>
      </div>
    </div>
  );
}
