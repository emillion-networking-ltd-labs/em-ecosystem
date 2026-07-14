"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { useState, useRef, forwardRef, type ReactNode } from "react";
import { tv } from "tailwind-variants";
import { Eye, EyeOff } from "lucide-react";
import Icon from "./Icon";
import { STATUS_ICONS } from "@/lib/statusIcons";
import SpinnerCircle from "./SpinnerCircle";
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

const BOX_BASE =
  "flex items-center gap-2 rounded-lg border border-border-components transition-colors";
const SIZE_CLASSES = {
  sm: "h-10 px-3 text-body",
  md: "h-12 px-4 text-body",
} as const;
const INPUT_EL =
  "min-w-0 flex-1 bg-transparent text-body leading-6 text-content-primary outline-hidden placeholder:text-content-placeholder";

// Contrato tv (raw-concat previo → twMerge:false). La CAJA del input (la superficie con estilo): variant
// (default con outline / filled con relleno) × size × estado (error, disabled). El outline SOLO aplica a la
// variante `default` (filled lo oculta) → compoundVariants. Reproduce EXACTAMENTE la composición imperativa previa.
export const inputBox = tv(
  {
    base: BOX_BASE,
    variants: {
      variant: {
        default: "bg-transparent outline-solid outline-2 outline-offset-2",
        filled: "bg-surface-primary outline-hidden",
      },
      size: { sm: SIZE_CLASSES.sm, md: SIZE_CLASSES.md },
      error: { true: "", false: "" },
      disabled: {
        true: "cursor-not-allowed opacity-60",
        false: "cursor-text",
      },
    },
    compoundVariants: [
      // El outline es SOLO de la variante default (filled va sin él).
      { variant: "default", error: true, class: "outline-error/75" },
      {
        variant: "default",
        error: false,
        class:
          "outline-transparent hover:outline-content-primary/75 focus-within:outline-content-primary/75",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      error: false,
      disabled: false,
    },
  },
  { twMerge: false },
);

// Superficie de docs (consumida por ComponentShowcase). Las clases reales single-source desde los consts;
// las descripciones de estados/iconos se conservan.
export const inputSpecs = {
  container: `${BOX_BASE} bg-transparent outline-solid outline-2 outline-offset-2`,
  sizes: {
    sm: "h-10 px-3 text-body (40px — compact contexts)",
    "md (default)": "h-12 px-4 text-body (48px — forms, auth)",
  },
  label: "text-body font-semibold",
  input: INPUT_EL,
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
    error:
      "shrink-0 text-error (CircleX, Icon size=sm/14px — proporcional al texto caption)",
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
  const isErrorState = !!(error || hasError);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`text-body font-semibold ${isErrorState ? "text-error/75" : "text-content-primary"}`}
        >
          {label}
        </label>
      )}
      <div
        className={inputBox({
          variant,
          size,
          error: isErrorState,
          disabled: !!disabled,
        })}
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
          className={INPUT_EL}
          {...props}
        />
        {isPassword && !loading && (
          <IconButton
            size="sm"
            icon={showPassword ? EyeOff : Eye}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          />
        )}
        {rightIcon && !isPassword && !loading && (
          <span className="shrink-0">{rightIcon}</span>
        )}
        {loading && (
          <span className="shrink-0">
            <SpinnerCircle size="sm" />
          </span>
        )}
      </div>
      {error && (
        <div
          id={`${inputId}-error`}
          className="flex items-center gap-2"
          role="alert"
        >
          <Icon
            icon={STATUS_ICONS.error}
            size="sm"
            className="shrink-0 text-error"
          />
          <p className="flex-1 text-caption leading-6 text-error">{error}</p>
        </div>
      )}
    </div>
  );
});

export default Input;
