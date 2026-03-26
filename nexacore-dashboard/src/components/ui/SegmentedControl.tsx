"use client";

import React from "react";

export const segmentedControlSpecs = {
  container:
    "inline-flex rounded-lg border border-border-strong bg-surface-subtle p-1",
  option: {
    base: "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-caption font-normal transition-colors",
    active: "bg-surface-primary text-content-primary shadow-sm",
    inactive: "text-content-primary/50 hover:text-content-primary",
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
  className?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex rounded-lg border border-border-strong bg-surface-subtle p-1 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-caption font-normal transition-colors ${
            value === option.value
              ? "bg-surface-primary text-content-primary shadow-sm"
              : "text-content-primary/50 hover:text-content-primary"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
