"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input, type InputProps } from "@/components/Input";

export function PasswordInput(
  props: Omit<InputProps, "type" | "rightAdornment">
) {
  const [show, setShow] = useState(false);

  return (
    <Input
      {...props}
      type={show ? "text" : "password"}
      rightAdornment={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="grid size-7 place-items-center rounded-md transition-colors hover:bg-muted hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
}
