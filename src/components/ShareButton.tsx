"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, Share2 } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/Typography";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /** Path or absolute URL to share. Path will be resolved against window.origin. */
  url: string;
  title: string;
  text?: string;
  variant?: "outline" | "ghost";
  className?: string;
  label?: string;
}

function resolveUrl(url: string): string {
  if (typeof window === "undefined") return url;
  return url.startsWith("http") ? url : new URL(url, window.location.origin).toString();
}

export function ShareButton({
  url,
  title,
  text,
  variant = "outline",
  className,
  label,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function handleClick() {
    const full = resolveUrl(url);
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text, url: full });
        return;
      } catch {
        // user cancelled or share failed — fall through to menu
      }
    }
    setOpen((v) => !v);
  }

  function shareToWhatsApp() {
    const full = resolveUrl(url);
    const msg = encodeURIComponent(`${text ?? title}\n${full}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(resolveUrl(url));
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy", "Try sharing via WhatsApp instead");
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            aria-label={label ? undefined : "Share"}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm shadow-xs transition-colors hover:bg-muted",
              variant === "ghost" && "border-transparent bg-transparent shadow-none",
              !label && "size-10 px-0"
            )}
          >
            <Share2 className="size-4" />
            {label && <Typography variant="label-sm">{label}</Typography>}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Share</TooltipContent>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 flex w-56 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <MenuItem onClick={shareToWhatsApp} icon={WhatsAppIcon} label="Share to WhatsApp" />
          <MenuItem onClick={copyLink} icon={Link2} label="Copy link" />
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function MenuItem({ onClick, icon: Icon, label }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted"
    >
      <Icon className="size-4 text-muted-foreground" />
      <Typography variant="label-sm">{label}</Typography>
    </button>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.1-.2.3-.7.8-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.8-.8-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4 0 1.4 1 2.7 1.2 2.9.1.2 2 3 4.7 4.1.7.3 1.2.5 1.6.6.7.2 1.3.2 1.7.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 4.9L2 22l5.3-1.3c1.4.7 3 1.1 4.7 1.1 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3c-.9-1.4-1.3-3-1.3-4.6 0-4.6 3.7-8.3 8.3-8.3 2.2 0 4.3.9 5.9 2.4 1.6 1.6 2.4 3.7 2.4 5.9 0 4.6-3.7 8.3-8.3 8.3z" />
    </svg>
  );
}
