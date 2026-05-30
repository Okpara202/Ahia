"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "recording"; durationMs: number }
  | { kind: "denied" };

export interface VoiceRecording {
  file: File;
  durationMs: number;
}

/**
 * Voice-recording state machine backed by `MediaRecorder`. The hook is
 * deliberately passive about the 3-minute cap — the UI watches `state.durationMs`
 * and triggers `stop()` when the cap is hit. This keeps the hook itself
 * easy to reason about and lets the UI decide how the cap is presented.
 *
 * Mic picks a webm/opus or audio/mp4 mime type per browser support (Safari
 * lacks webm). Backend stores the upload in Cloudinary as resource_type=video
 * so the returned URL plays directly in an <audio> element.
 */
export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>({ kind: "idle" });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    if (state.kind !== "idle" && state.kind !== "denied") return;
    setState({ kind: "starting" });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState({ kind: "denied" });
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    // Browsers disagree about which container/codec is implemented. Safari
    // (iOS + macOS) doesn't support audio/webm and falls back to audio/mp4.
    // Chrome/Firefox/Edge prefer webm with the opus codec for size + quality.
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ];
    const mimeType = candidates.find(
      (m) =>
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)
    );

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      cleanup();
      setState({ kind: "denied" });
      return;
    }

    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    const startedAt = Date.now();
    startedAtRef.current = startedAt;
    try {
      recorder.start();
    } catch {
      cleanup();
      setState({ kind: "idle" });
      return;
    }
    setState({ kind: "recording", durationMs: 0 });

    tickRef.current = window.setInterval(() => {
      setState({ kind: "recording", durationMs: Date.now() - startedAt });
    }, 200);
  }, [state.kind, cleanup]);

  const stop = useCallback(async (): Promise<VoiceRecording | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cleanup();
      setState({ kind: "idle" });
      return null;
    }

    const durationMs = Date.now() - startedAtRef.current;

    return new Promise<VoiceRecording | null>((resolve) => {
      const onStop = () => {
        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        const ext = mime.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `voice-${Date.now()}.${ext}`, {
          type: mime,
        });
        cleanup();
        setState({ kind: "idle" });
        resolve({ file, durationMs });
      };
      recorder.addEventListener("stop", onStop, { once: true });
      try {
        recorder.stop();
      } catch {
        recorder.removeEventListener("stop", onStop);
        cleanup();
        setState({ kind: "idle" });
        resolve(null);
      }
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // ignore — best effort
      }
    }
    cleanup();
    setState({ kind: "idle" });
  }, [cleanup]);

  const dismissDenied = useCallback(() => {
    setState((s) => (s.kind === "denied" ? { kind: "idle" } : s));
  }, []);

  return { state, start, stop, cancel, dismissDenied };
}
