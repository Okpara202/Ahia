"use client";

import { useState } from "react";
import { HandCoins, ImagePlus, Send } from "lucide-react";

import { ChatAttachSheet } from "./ChatAttachSheet";

interface ChatInputProps {
  onSend: (text: string) => void;
  onSendOffer: (amount: number, note?: string) => void;
  onSendImage: (file: File, caption?: string) => void;
}

type SheetMode = "offer" | "image" | null;

export function ChatInput({ onSend, onSendOffer, onSendImage }: ChatInputProps) {
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState<SheetMode>(null);

  function handleSend() {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border bg-background/95 px-4 pb-20 pt-3 backdrop-blur-md sm:px-6 md:pb-3">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <button
          type="button"
          onClick={() => setSheet("image")}
          aria-label="Attach image"
          title="Attach image"
          className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ImagePlus className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setSheet("offer")}
          aria-label="Make an offer"
          title="Make an offer"
          className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent/15 hover:text-accent"
        >
          <HandCoins className="size-5" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Type a message…"
          className="flex max-h-32 min-h-10 w-full resize-none rounded-2xl border border-input bg-card px-4 py-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 dark:bg-input/30"
        />
        <button
          type="button"
          onClick={handleSend}
          aria-label="Send message"
          disabled={!text.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </div>

      <ChatAttachSheet
        mode={sheet}
        onClose={() => setSheet(null)}
        onSendOffer={(amount, note) => {
          onSendOffer(amount, note);
          setSheet(null);
        }}
        onSendImage={(file, caption) => {
          onSendImage(file, caption);
          setSheet(null);
        }}
      />
    </div>
  );
}
