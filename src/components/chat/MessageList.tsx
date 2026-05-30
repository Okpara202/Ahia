"use client";

import { useEffect, useRef } from "react";

import { Typography } from "@/components/Typography";
import type { Message } from "@/types";
import { ImageMessageCard } from "./ImageMessageCard";
import { MessageBubble } from "./MessageBubble";
import { OfferCard } from "./OfferCard";
import { PaymentRequestCard } from "./PaymentRequestCard";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  /** Product the conversation is about — threaded to OfferCard so the
   *  buyer's "Pay" button on accepted offers knows what to check out. */
  productId: string;
}

export function MessageList({
  messages,
  currentUserId,
  productId,
}: MessageListProps) {
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
            next.type !== "text";

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

          if (message.type === "payment_request") {
            return (
              <PaymentRequestCard key={message.id} message={message} />
            );
          }

          if (message.type === "offer") {
            return (
              <OfferCard
                key={message.id}
                message={message}
                canRespond={!mine}
                productId={productId}
              />
            );
          }

          if (message.type === "image") {
            return (
              <ImageMessageCard
                key={message.id}
                message={message}
                mine={mine}
              />
            );
          }

          return (
            <MessageBubble
              key={message.id}
              message={message}
              mine={mine}
              showTime={showTime}
            />
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
