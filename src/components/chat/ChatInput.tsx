"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Mic, Send } from "lucide-react";

import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { toast } from "@/store/toastStore";
import type { Message } from "@/types";
import { ChatAttachSheet } from "./ChatAttachSheet";
import { InvoiceComposer } from "./InvoiceComposer";
import { MAX_RECORDING_MS, VoiceRecorderBar } from "./VoiceRecorderBar";

/** Discard anything shorter than this — accidental taps. */
const MIN_RECORDING_MS = 500;

interface ChatInputProps {
  conversationId: string;
  perspective: "buyer" | "seller";
  onSend: (text: string) => void;
  onSendImage: (file: File, caption?: string) => void;
  onSendVoice: (file: File, durationMs: number) => void;
  /** Fired when the seller's invoice composer returns a persisted message
   *  — parent prepends it to the chat without a refetch. */
  onInvoiceSent: (message: Message) => void;
}

type SheetMode = "image" | "invoice" | null;

export function ChatInput({
  conversationId,
  perspective,
  onSend,
  onSendImage,
  onSendVoice,
  onInvoiceSent,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState<SheetMode>(null);
  const recorder = useVoiceRecorder();
  const isSeller = perspective === "seller";

  // Buyer mobile needs extra bottom padding to clear BuyerBottomNav (h-16ish).
  // Seller has no bottom nav anywhere — input sits flush against the
  // viewport bottom.
  const bottomPadding =
    perspective === "buyer" ? "pb-20 md:pb-3" : "pb-3";

  const isRecordingOrStarting =
    recorder.state.kind === "recording" || recorder.state.kind === "starting";
  const recordingMs =
    recorder.state.kind === "recording" ? recorder.state.durationMs : 0;

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

  async function startRecord() {
    await recorder.start();
  }

  async function sendVoice() {
    const result = await recorder.stop();
    if (!result) return;
    if (result.durationMs < MIN_RECORDING_MS || result.file.size === 0) return;
    onSendVoice(result.file, result.durationMs);
  }

  // Show a denial toast when the browser blocks the mic.
  useEffect(() => {
    if (recorder.state.kind === "denied") {
      toast.error(
        "Microphone blocked",
        "Allow microphone access in your browser to send voice notes."
      );
      recorder.dismissDenied();
    }
  }, [recorder.state.kind, recorder]);

  // Auto-send when the 3-minute cap is hit. Holding sendVoice in a ref so
  // the effect only fires on duration change, not on every parent re-render.
  const sendVoiceRef = useRef(sendVoice);
  useEffect(() => {
    sendVoiceRef.current = sendVoice;
  });
  useEffect(() => {
    if (recordingMs >= MAX_RECORDING_MS) {
      sendVoiceRef.current();
    }
  }, [recordingMs]);

  if (isRecordingOrStarting) {
    return (
      <div
        className={`border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-md sm:px-6 ${bottomPadding}`}
      >
        <div className="mx-auto w-full max-w-3xl">
          <VoiceRecorderBar
            durationMs={recordingMs}
            starting={recorder.state.kind === "starting"}
            onCancel={recorder.cancel}
            onSend={sendVoice}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-md sm:px-6 ${bottomPadding}`}
    >
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        {isSeller && (
          <button
            type="button"
            onClick={() => setSheet("invoice")}
            aria-label="Create invoice"
            title="Create invoice"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <FileText className="size-5" />
          </button>
        )}
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
          onClick={startRecord}
          aria-label="Record voice note"
          title="Record voice note"
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
        mode={sheet === "image" ? "image" : null}
        onClose={() => setSheet(null)}
        onSendImage={(file, caption) => {
          onSendImage(file, caption);
          // Keep the sheet open across multi-image batch sends — caller calls
          // this once per image. Close once everything is queued.
          setSheet(null);
        }}
      />
      <InvoiceComposer
        open={sheet === "invoice"}
        conversationId={conversationId}
        onClose={() => setSheet(null)}
        onSent={(message) => {
          onInvoiceSent(message);
          setSheet(null);
        }}
      />
    </div>
  );
}
