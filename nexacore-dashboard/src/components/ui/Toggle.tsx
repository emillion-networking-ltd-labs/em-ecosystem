"use client";

import { useId } from "react";

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  id?: string;
  className?: string;
}

const trackSizes = {
  sm: "w-8 h-[18px]",
  md: "w-10 h-[22px]",
};

const circleSizes = {
  sm: "w-3.5 h-3.5",
  md: "w-[18px] h-[18px]",
};

const circleTranslate = {
  sm: "translate-x-[14px]",
  md: "translate-x-[18px]",
};

export default function Toggle({
  checked = false,
  onChange,
  label,
  disabled = false,
  size = "md",
  id: externalId,
  className = "",
}: ToggleProps) {
  const autoId = useId();
  const id = externalId ?? autoId;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? "Toggle"}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex items-center rounded-full border transition-colors duration-200 shrink-0 ${trackSizes[size]} ${
          checked
            ? "bg-surface-inverse border-surface-inverse"
            : "bg-surface-subtle border-border-default"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow transition-transform duration-200 ${circleSizes[size]} ${
            checked ? circleTranslate[size] : "translate-x-0.5"
          }`}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          className={`text-body-sm font-medium text-content-primary select-none ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
}
