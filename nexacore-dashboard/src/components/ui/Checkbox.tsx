"use client";

import { useId, useRef, useEffect } from "react";
import { Check, Minus } from "lucide-react";

interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  id?: string;
  className?: string;
}

export default function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
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
          className={`w-5 h-5 rounded-[5px] border flex items-center justify-center transition-colors ${
            checked || indeterminate
              ? "bg-surface-inverse border-surface-inverse"
              : "bg-surface-primary border-border-default"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => !disabled && onChange?.(!checked)}
          aria-hidden="true"
        >
          {indeterminate ? (
            <Minus size={14} strokeWidth={2} className="text-content-inverse" />
          ) : checked ? (
            <Check size={14} strokeWidth={2} className="text-content-inverse" />
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
