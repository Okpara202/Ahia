"use client";

import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/Typography";
import { API_BASE_URL } from "@/lib/api";
import { markJustAuthed } from "@/lib/authSignal";
import { toast } from "@/store/toastStore";

interface OAuthButtonsProps {
  context: "login" | "signup";
}

export function OAuthButtons({ context }: OAuthButtonsProps) {
  const params = useSearchParams();
  const verb = context === "login" ? "Sign in" : "Sign up";
  // Backend `?next=` only accepts relative paths starting with "/". Carry the
  // signup/login next= straight through to the OAuth flow.
  const nextPath = params.get("next") ?? "/feed";

  function startGoogleOAuth() {
    // Tell the post-redirect StoreHydrator that this is a fresh auth attempt —
    // if /auth/me 401s when we land back, that's a cookie-drop fingerprint
    // (Brave Shields, etc.), not a true guest visit. See lib/authSignal.ts.
    markJustAuthed();
    // Hard navigation (not router.push) — the redirect chain hits the backend
    // and finally lands back on us with the session cookie set.
    const next = encodeURIComponent(nextPath);
    window.location.href = `${API_BASE_URL}/auth/google/start?next=${next}`;
  }

  function showAppleComingSoon() {
    toast.info(
      "Apple sign-in is coming",
      "Use Google or email for now."
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={startGoogleOAuth}
        variant="outline"
        size="lg"
        className="w-full justify-center gap-3"
      >
        <GoogleMark />
        <span>{verb} with Google</span>
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={showAppleComingSoon}
            variant="outline"
            size="lg"
            className="w-full justify-center gap-3 opacity-60"
          >
            <AppleMark />
            <span>{verb} with Apple</span>
            <Typography
              variant="label-sm"
              className="ml-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground"
            >
              soon
            </Typography>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Coming soon — use Google or email</TooltipContent>
      </Tooltip>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0 fill-foreground"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.05 12.04c-.03-3.18 2.6-4.7 2.72-4.78-1.48-2.17-3.79-2.47-4.6-2.5-1.95-.2-3.82 1.15-4.82 1.15-.99 0-2.53-1.12-4.17-1.09-2.14.03-4.12 1.24-5.22 3.16-2.23 3.87-.57 9.59 1.6 12.73 1.07 1.54 2.34 3.27 4 3.21 1.61-.07 2.22-1.04 4.16-1.04 1.95 0 2.49 1.04 4.19 1 1.73-.03 2.83-1.57 3.89-3.12 1.22-1.79 1.73-3.53 1.76-3.62-.04-.02-3.38-1.3-3.51-5.1zM14.06 3.85c.88-1.07 1.48-2.55 1.31-4.04-1.27.05-2.81.85-3.72 1.92-.82.94-1.54 2.45-1.34 3.91 1.41.11 2.86-.72 3.75-1.79z" />
    </svg>
  );
}
