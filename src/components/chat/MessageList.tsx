"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import { Typography } from "@/components/Typography";
import type { Message, MessageContextProduct } from "@/types";
import type { ChatPerspective } from "./ChatHeader";
import { ImageMessageCard } from "./ImageMessageCard";
import { InvoiceCard } from "./InvoiceCard";
import { MessageBubble } from "./MessageBubble";
import { VoicePlayer } from "./VoicePlayer";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  perspective: ChatPerspective;
}

export function MessageList({
  messages,
  currentUserId,
  perspective,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const isBuyer = perspective === "buyer";

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
            return (
              <div key={message.id} className="flex flex-col gap-1">
                {message.contextProduct && (
                  <ContextProductChip
                    product={message.contextProduct}
                    mine={mine}
                  />
                )}
                <div className={mine ? "flex justify-end" : "flex justify-start"}>
                  <VoicePlayer
                    voiceUrl={message.voiceUrl}
                    durationMs={message.voiceDurationMs}
                    mine={mine}
                  />
                </div>
              </div>
            );
          }

          if (message.type === "invoice") {
            return (
              <InvoiceCard
                key={message.id}
                message={message}
                isBuyer={isBuyer}
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
