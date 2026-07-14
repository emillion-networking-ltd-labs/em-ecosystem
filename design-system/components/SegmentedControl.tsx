"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import React from "react";
import Button from "./Button";

// Compuesto (ECO-174): cada segmento es un <Button> REAL — no re-implementa el estilo del botón.
// Activo = la variante elegida (primary/secondary/outline); inactivo = `ghost` (superficie de control
// transparente y quieta, añadida a Button en ECO-173). Fuente ÚNICA: si Button cambia, esto cambia.
export type SegmentedVariant = "primary" | "secondary" | "outline";

// `gap-1` entre segmentos = el mismo `p-1` (4px) que el contenedor deja alrededor → respiro uniforme.
const CONTAINER =
  "inline-flex gap-1 rounded-lg border border-line-strong bg-surface-subtle p-1";

// Superficie de docs (consumida por ComponentShowcase). Refleja la COMPOSICIÓN, no clases re-implementadas.
export const segmentedControlSpecs = {
  container: CONTAINER,
  variants: {
    active:
      "Segmento seleccionado = <Button variant> (primary/secondary/outline) — reusa Button",
    inactive:
      'Segmento no seleccionado = <Button variant="ghost"> — reusa Button',
  },
  sizes: {
    "sm (default)": "Button sm — h-8 px-4 text-caption (32px)",
    md: "Button md — h-10 px-6 text-body (40px)",
    lg: "Button lg — h-12 px-8 text-h3 (48px)",
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
    <div className={`${CONTAINER} ${className}`}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Button
            key={option.value}
            variant={selected ? variant : "ghost"}
            size={size}
            fullWidth={false}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
          >
            {option.icon}
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
