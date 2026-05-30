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

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        mine ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 sm:max-w-[70%]",
          mine
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-card text-foreground"
        )}
      >
        <Typography
          variant="body-sm"
          className={mine ? "text-primary-foreground" : "text-foreground"}
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
