"use client";

import { useState } from "react";
import { ImagePlus, Mic, Send } from "lucide-react";

import { toast } from "@/store/toastStore";
import { ChatAttachSheet } from "./ChatAttachSheet";

interface ChatInputProps {
  onSend: (text: string) => void;
  onSendImage: (file: File, caption?: string) => void;
}

type SheetMode = "image" | null;

export function ChatInput({ onSend, onSendImage }: ChatInputProps) {
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

  function showVoiceComingSoon() {
    // Voice recorder lands in Phase 2. The mic button is stubbed here so
    // the layout doesn't shift when it ships.
    toast.info(
      "Voice notes are coming",
      "We're building the recorder right now. Use text for now."
    );
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
          onClick={showVoiceComingSoon}
          aria-label="Record voice note"
          title="Voice notes coming soon"
          className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Mic className="size-5" />
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
        onSendImage={(file, caption) => {
          onSendImage(file, caption);
          setSheet(null);
        }}
      />
    </div>
  );
}
