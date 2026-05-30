import * as React from "react";

import { Input as BaseInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  labelEndAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export function Input({
  id,
  label,
  labelEndAdornment,
  rightAdornment,
  error,
  helperText,
  className,
  containerClassName,
  labelClassName,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const describedById = error
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-help`
      : undefined;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium text-foreground",
              labelClassName
            )}
          >
            {label}
          </label>
          {labelEndAdornment}
        </div>
      )}
      <div className="relative">
        <BaseInput
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(rightAdornment && "pr-11", className)}
          {...props}
        />
        {rightAdornment && (
          <div className="absolute inset-y-0 right-1.5 flex items-center text-muted-foreground">
            {rightAdornment}
          </div>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
