"use client";

import { useState, useRef, forwardRef, type ReactNode } from "react";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import Spinner from "./Spinner";
import IconButton from "./IconButton";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  error?: string;
  hasError?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: "sm" | "md";
  variant?: "default" | "filled";
}

const sizeClasses = {
  sm: "h-10 px-3 text-body",
  md: "h-12 px-4 text-body",
};

export const inputSpecs = {
  container:
    "flex items-center gap-2 rounded-lg border border-border-strong bg-transparent outline outline-2 outline-offset-2 transition-colors",
  sizes: {
    sm: "h-10 px-3 text-body (40px — compact contexts)",
    "md (default)": "h-12 px-4 text-body (48px — forms, auth)",
  },
  label: "text-body font-semibold leading-[22px]",
  input:
    "min-w-0 flex-1 bg-transparent text-body leading-6 text-content-primary outline-none placeholder:text-content-placeholder",
  states: {
    default: "outline-transparent",
    hover: "hover:outline-content-primary/75",
    focus: "focus-within:outline-content-primary/75",
    error: "outline-error/75",
    disabled: "cursor-not-allowed opacity-60",
    "filled variant": "bg-surface-primary, no outline (search bars, dropdowns)",
  },
  icons: {
    left: "shrink-0 text-content-secondary (16px)",
    right: "shrink-0 (custom ReactNode)",
    password: "IconButton size=sm default variant (32px hit area, 16px icon)",
    error: "shrink-0 text-error (TriangleAlert 16px)",
  },
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hasError = false,
    loading = false,
    leftIcon,
    rightIcon,
    size = "md",
    variant = "default",
    type = "text",
    className = "",
    disabled,
    id,
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;
  const inputId = id || props.name;
  const isPassword = type === "password";

  /* Outline states */
  const isErrorState = !!(error || hasError);
  const isFilled = variant === "filled";
  const outlineClass = isFilled
    ? "outline-none"
    : isErrorState
      ? "outline-error/75"
      : "outline-transparent hover:outline-content-primary/75 focus-within:outline-content-primary/75";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`text-body font-semibold leading-[22px] ${isErrorState ? "text-error/75" : "text-content-primary"}`}
        >
          {label}
        </label>
      )}
      <div
        className={`
          flex items-center gap-2 rounded-lg border border-border-strong
          ${isFilled ? "bg-surface-primary" : "bg-transparent outline outline-2 outline-offset-2"}
          transition-colors
          ${sizeClasses[size]}
          ${outlineClass}
          ${disabled ? "cursor-not-allowed opacity-60" : "cursor-text"}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {leftIcon && (
          <span className="shrink-0 text-content-secondary">{leftIcon}</span>
        )}
        <input
          id={inputId}
          type={isPassword && showPassword ? "text" : type}
          disabled={disabled || loading}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          ref={inputRef}
          className="min-w-0 flex-1 bg-transparent text-body leading-6 text-content-primary outline-none placeholder:text-content-placeholder"
          {...props}
        />
        {isPassword && !loading && (
          <IconButton
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </IconButton>
        )}
        {rightIcon && !isPassword && !loading && (
          <span className="shrink-0">{rightIcon}</span>
        )}
        {loading && (
          <span className="shrink-0">
            <Spinner size="sm" />
          </span>
        )}
      </div>
      {error && (
        <div
          id={`${inputId}-error`}
          className="flex items-center gap-2"
          role="alert"
        >
          <TriangleAlert size={16} className="shrink-0 text-error" />
          <p className="flex-1 text-caption leading-6 text-error">{error}</p>
        </div>
      )}
    </div>
  );
});

export default Input;
