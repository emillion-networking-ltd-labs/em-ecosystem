"use client";

import { useState, useRef, type ReactNode } from "react";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import Spinner from "./Spinner";

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  error?: string;
  hasError?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  size?: "sm" | "md";
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
  },
  icons: {
    left: "shrink-0 text-content-secondary (16px)",
    password:
      "shrink-0 text-content-secondary hover:text-content-primary/75 (16px)",
    error: "shrink-0 text-error (TriangleAlert 16px)",
  },
};

export default function Input({
  label,
  error,
  hasError = false,
  loading = false,
  leftIcon,
  size = "md",
  type = "text",
  className = "",
  disabled,
  id,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = id || props.name;
  const isPassword = type === "password";

  /* Outline states (ui-design-system: border always 1px black/5, outline on top)
     default: no outline | hover: 2px black/75 | focus: 2px black/75 | error: 2px error/75 */
  const isErrorState = !!(error || hasError);
  const outlineClass = isErrorState
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
          flex items-center gap-2 rounded-lg border border-border-strong bg-transparent
          outline outline-2 outline-offset-2 transition-colors
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
          className={`min-w-0 flex-1 bg-transparent ${size === "sm" ? "text-body" : "text-body"} leading-6 text-content-primary outline-none placeholder:text-content-placeholder`}
          {...props}
        />
        {isPassword && !loading && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="shrink-0 text-content-secondary hover:text-content-primary/75"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
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
}
