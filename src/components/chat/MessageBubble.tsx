import { ShieldCheck } from "lucide-react";

import { Typography } from "@/components/Typography";
import { cn } from "@/lib/utils";
import type { TextMessage } from "@/types";

interface MessageBubbleProps {
  message: TextMessage;
  mine: boolean;
  showTime: boolean;
}

export function MessageBubble({
  message,
  mine,
  showTime,
}: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
  const isAdmin = message.senderType === "admin";

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        mine && !isAdmin ? "items-end" : "items-start"
      )}
    >
      {isAdmin && (
        <div className="flex items-center gap-1 px-1 text-accent">
          <ShieldCheck className="size-3.5" />
          <Typography variant="caption" className="font-medium">
            {message.senderName ?? "Ahia Support"}
          </Typography>
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 sm:max-w-[70%]",
          isAdmin
            ? "rounded-bl-md border border-accent/40 bg-accent/10 text-foreground"
            : mine
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-card text-foreground"
        )}
      >
        <Typography
          variant="body-sm"
          className={
            isAdmin
              ? "text-foreground"
              : mine
                ? "text-primary-foreground"
                : "text-foreground"
          }
        >
          {message.content}
        </Typography>
      </div>
      {showTime && (
        <Typography
          variant="caption"
          className="px-1 text-muted-foreground"
        >
          {time}
        </Typography>
      )}
    </div>
  );
}
