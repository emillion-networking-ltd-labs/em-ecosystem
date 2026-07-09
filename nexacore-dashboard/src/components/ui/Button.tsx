"use client";

import React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import SpinnerInfinity from "./SpinnerInfinity";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "danger" | "link" | "link-underline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  as?: React.ElementType;
  href?: string;
}

// Las variantes de CONTROL (no-link) son una superficie de botón; las link son texto navegable.
const CONTROL = ["primary", "secondary", "outline", "danger"] as const;
const LINK = ["link", "link-underline"] as const;

// Contrato de variante del DS (design-system-quality / ADR-029): tailwind-variants con slots.
// Button es la pieza de REFERENCIA — todo primitivo/compuesto declara sus variantes con este contrato
// (base + variants + compoundVariants + defaultVariants + slots), nunca con mapas sueltos ni ternarios ad-hoc.
//
// Slots (partes del DOM): root = la superficie del control · label = el contenido · spinner = overlay de carga.
// El eje `size` lleva SOLO el texto (compartido por control y link); la caja del control (padding/alto/radio)
// y el display se aplican por compoundVariant según la clase de variante — así las link no heredan la caja.
export const button = tv({
  slots: {
    root: "relative items-center justify-center gap-2 whitespace-nowrap",
    label: "inline-flex items-center gap-2",
    spinner: "absolute inset-0 flex items-center justify-center",
  },
  variants: {
    variant: {
      primary: {
        root: "bg-surface-inverse text-content-inverse border border-border-strong transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
      },
      secondary: {
        root: "bg-surface-tertiary text-content-secondary border border-border-strong transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50",
      },
      outline: {
        root: "bg-transparent text-content-primary border border-border-components transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50",
      },
      danger: {
        root: "bg-transparent text-error border border-error-border transition-colors hover:bg-error-bg disabled:pointer-events-none disabled:opacity-50",
      },
      link: {
        root: "bg-transparent text-content-primary/75 border-0 transition-colors hover:text-content-primary disabled:pointer-events-none disabled:opacity-50",
      },
      "link-underline": {
        root: "bg-transparent text-content-primary/75 border-0 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted disabled:pointer-events-none disabled:opacity-50",
      },
    },
    size: {
      sm: { root: "text-caption font-normal" },
      md: { root: "text-body font-normal" },
      lg: { root: "text-h3 font-normal" },
    },
    fullWidth: { true: {}, false: {} },
    loading: { true: { label: "opacity-30" }, false: {} },
  },
  compoundVariants: [
    // Caja del control (padding + radio + alto) por tamaño — SOLO para variantes de control (las link no).
    {
      variant: CONTROL,
      size: "sm",
      class: { root: "px-4 py-1.5 rounded-md h-8" },
    },
    {
      variant: CONTROL,
      size: "md",
      class: { root: "px-6 py-2.5 rounded-md h-10" },
    },
    {
      variant: CONTROL,
      size: "lg",
      class: { root: "px-8 py-3 rounded-md h-12" },
    },
    // Display + selección para las variantes de control. ECO-115: son SUPERFICIE DE CONTROL → `select-none`
    // (con `as="a"` se rinde un <a> sin role=button, p.ej. el CTA del Hero; `button *`/`[role]*` no lo cubre y
    // mostraría el caret I-beam → se marca aquí). `fullWidth` (default true, para formularios) → flex + w-full.
    {
      variant: CONTROL,
      fullWidth: true,
      class: { root: "flex w-full select-none" },
    },
    {
      variant: CONTROL,
      fullWidth: false,
      class: { root: "inline-flex select-none" },
    },
    // Las variantes link/link-underline son TEXTO inline navegable (seleccionable → sin select-none) y siempre
    // inline-flex, ignorando fullWidth.
    { variant: LINK, class: { root: "inline-flex" } },
  ],
  defaultVariants: {
    variant: "primary",
    size: "md",
    fullWidth: true,
    loading: false,
  },
});

export type ButtonVariants = VariantProps<typeof button>;

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  children,
  className,
  disabled,
  href,
  ...props
}: ButtonProps) {
  const isLink = variant === "link" || variant === "link-underline";
  const { root, label, spinner } = button({
    variant,
    size,
    fullWidth,
    loading,
  });

  const componentProps: Record<string, unknown> = {
    className: root({ className }),
    ...props,
  };

  if (href) componentProps.href = href;
  if (Component === "button") componentProps.disabled = loading || disabled;
  // ECO-141: las variantes link son TEXTO copiable renderizado como <a>; el drag nativo del enlace impediría
  // seleccionar su texto → draggable=false lo habilita (el click sigue navegando). Las de control son select-none.
  if (isLink) componentProps.draggable = false;

  return React.createElement(
    Component,
    componentProps,
    <span key="label" className={label()}>
      {children}
    </span>,
    loading && (
      <span
        key="spinner"
        role="status"
        aria-label="Loading"
        className={spinner()}
      >
        <SpinnerInfinity size={size === "lg" ? "lg" : "md"} />
      </span>
    ),
  );
}
