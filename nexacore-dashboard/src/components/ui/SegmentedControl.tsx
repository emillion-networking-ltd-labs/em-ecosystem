"use client";

import React from "react";

export type SegmentedVariant = "primary" | "secondary" | "outline";

const activeClasses: Record<SegmentedVariant, string> = {
  primary:
    "bg-surface-inverse text-content-inverse border border-border-components shadow-xs",
  secondary:
    "bg-surface-tertiary text-content-primary border border-border-components shadow-xs",
  outline:
    "bg-surface-primary text-content-primary border border-border-components shadow-xs",
};

export const sizeClasses = {
  sm: "h-8 px-4 text-caption",
  md: "h-10 px-6 text-body",
  lg: "h-12 px-8 text-h3",
};

export const segmentedControlSpecs = {
  container:
    "inline-flex rounded-lg border border-border-components bg-surface-subtle p-1",
  option: {
    base: "flex items-center gap-1.5 rounded-md font-normal transition-all",
    inactive:
      "border border-transparent text-content-primary/50 hover:text-content-primary",
  },
  sizes: {
    "sm (default)": "h-8 px-4 text-caption (32px)",
    md: "h-10 px-6 text-body (40px)",
    lg: "h-12 px-8 text-h3 (48px)",
  },
  variants: {
    "primary (default)":
      "bg-surface-inverse text-content-inverse border border-border-components shadow-xs",
    secondary:
      "bg-surface-tertiary text-content-primary border border-border-components shadow-xs",
    outline:
      "bg-surface-primary text-content-primary border border-border-components shadow-xs",
  },
};

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: SegmentedVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "primary",
  size = "sm",
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex rounded-lg border border-border-components bg-surface-subtle p-1 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-1.5 rounded-md font-normal transition-all ${sizeClasses[size]} ${
            value === option.value
              ? activeClasses[variant]
              : "border border-transparent text-content-primary/50 hover:text-content-primary"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
