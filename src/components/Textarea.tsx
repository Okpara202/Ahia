import * as React from "react";

import { Textarea as BaseTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export function Textarea({
  id,
  label,
  error,
  helperText,
  className,
  containerClassName,
  labelClassName,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const textareaId = id ?? generatedId;
  const describedById = error
    ? `${textareaId}-error`
    : helperText
      ? `${textareaId}-help`
      : undefined;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className={cn(
            "text-sm font-medium text-foreground",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <BaseTextarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={className}
        {...props}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${textareaId}-help`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
