"use client";

import React from "react";
import { tv } from "tailwind-variants";

export type SegmentedVariant = "primary" | "secondary" | "outline";

const CONTAINER_BASE =
  "inline-flex rounded-lg border border-border-strong bg-surface-subtle p-1";
const OPTION_BASE =
  "flex items-center gap-1.5 rounded-md font-normal transition-all";
const OPTION_INACTIVE =
  "border border-transparent text-content-secondary hover:text-content-primary";

const ACTIVE_CLASSES: Record<SegmentedVariant, string> = {
  primary:
    "bg-surface-inverse text-content-inverse border border-border-strong shadow-xs",
  secondary:
    "bg-surface-tertiary text-content-primary border border-border-strong shadow-xs",
  outline:
    "bg-surface-primary text-content-primary border border-border-strong shadow-xs",
};

const SIZE_CLASSES = {
  sm: "h-8 px-4 text-caption",
  md: "h-10 px-6 text-body",
  lg: "h-12 px-8 text-h3",
};

// Contrato tv (raw-concat previo → twMerge:false). Dos superficies: el contenedor (sin ejes) y la opción.
// La variante SOLO pinta el estado activo (el inactivo es fijo) → se resuelve con compoundVariants (variant × active);
// el tamaño aplica siempre. Reproduce EXACTAMENTE el conjunto de clases de la composición imperativa previa.
export const segmentedControlContainer = tv(
  { base: CONTAINER_BASE },
  { twMerge: false },
);

export const segmentedOption = tv(
  {
    base: OPTION_BASE,
    variants: {
      // La variante solo aporta clases cuando está activa (via compoundVariants).
      variant: { primary: "", secondary: "", outline: "" },
      size: { sm: SIZE_CLASSES.sm, md: SIZE_CLASSES.md, lg: SIZE_CLASSES.lg },
      active: { true: "", false: OPTION_INACTIVE },
    },
    compoundVariants: [
      { variant: "primary", active: true, class: ACTIVE_CLASSES.primary },
      { variant: "secondary", active: true, class: ACTIVE_CLASSES.secondary },
      { variant: "outline", active: true, class: ACTIVE_CLASSES.outline },
    ],
    defaultVariants: { variant: "primary", size: "sm", active: false },
  },
  { twMerge: false },
);

export const segmentedControlSpecs = {
  container: CONTAINER_BASE,
  option: { base: OPTION_BASE, inactive: OPTION_INACTIVE },
  sizes: {
    "sm (default)": "h-8 px-4 text-caption (32px)",
    md: "h-10 px-6 text-body (40px)",
    lg: "h-12 px-8 text-h3 (48px)",
  },
  variants: {
    "primary (default)": ACTIVE_CLASSES.primary,
    secondary: ACTIVE_CLASSES.secondary,
    outline: ACTIVE_CLASSES.outline,
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
    <div className={segmentedControlContainer({ className })}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={segmentedOption({
            variant,
            size,
            active: value === option.value,
          })}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
