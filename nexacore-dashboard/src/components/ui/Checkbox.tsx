"use client";

import { useId, useRef, useEffect } from "react";
import { Check, Minus } from "lucide-react";

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  size?: "sm" | "md" | "lg";
  id?: string;
  className?: string;
}

const boxSizes = {
  sm: "w-4 h-4 rounded-[4px]",
  md: "w-5 h-5 rounded-[5px]",
  lg: "w-6 h-6 rounded-[6px]",
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export const checkboxSpecs = {
  box: {
    checked: "bg-surface-inverse border-surface-inverse",
    unchecked: "bg-surface-primary border-border-strong",
    indeterminate: "bg-surface-inverse border-surface-inverse",
    disabled: "opacity-50 cursor-not-allowed",
  },
  sizes: {
    sm: "box: 16×16px · icon: 12px · radius: 4px",
    "md (default)": "box: 20×20px · icon: 14px · radius: 5px",
    lg: "box: 24×24px · icon: 16px · radius: 6px",
  },
  label: "text-[15px] font-normal text-content-primary",
};

export default function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
  size = "md",
  id: externalId,
  className = "",
}: CheckboxProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const isChecked = indeterminate ? false : checked;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <input
          ref={inputRef}
          type="checkbox"
          id={id}
          checked={isChecked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          aria-checked={indeterminate ? "mixed" : checked}
        />
        <div
          className={`${boxSizes[size]} border flex items-center justify-center transition-colors ${
            checked || indeterminate
              ? "bg-surface-inverse border-surface-inverse"
              : "bg-surface-primary border-border-strong"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => !disabled && onChange?.(!checked)}
          aria-hidden="true"
        >
          {indeterminate ? (
            <Minus
              size={iconSizes[size]}
              strokeWidth={2}
              className="text-content-inverse"
            />
          ) : checked ? (
            <Check
              size={iconSizes[size]}
              strokeWidth={2}
              className="text-content-inverse"
            />
          ) : null}
        </div>
      </div>
      {label && (
        <label
          htmlFor={id}
          className={`text-[15px] font-normal text-content-primary select-none ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
}
