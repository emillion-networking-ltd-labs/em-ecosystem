"use client";

// Fixture de fidelidad ECO-172: copia FIEL del SegmentedControl previo (raw concat + mapas), de `main`.
// Referencia para verificar que la versión tv (contenedor + opción) produce el MISMO conjunto de clases.
// Se retira al cerrar la pieza.

import React from "react";

export type SegmentedVariant = "primary" | "secondary" | "outline";

const activeClasses: Record<SegmentedVariant, string> = {
  primary:
    "bg-surface-inverse text-content-inverse border border-border-strong shadow-xs",
  secondary:
    "bg-surface-tertiary text-content-primary border border-border-strong shadow-xs",
  outline:
    "bg-surface-primary text-content-primary border border-border-strong shadow-xs",
};

const sizeClasses = {
  sm: "h-8 px-4 text-caption",
  md: "h-10 px-6 text-body",
  lg: "h-12 px-8 text-h3",
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

export default function SegmentedControlOld<T extends string>({
  options,
  value,
  onChange,
  variant = "primary",
  size = "sm",
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
          className={`flex items-center gap-1.5 rounded-md font-normal transition-all ${sizeClasses[size]} ${
            value === option.value
              ? activeClasses[variant]
              : "border border-transparent text-content-secondary hover:text-content-primary"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
