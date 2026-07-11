"use client";

import React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import SpinnerInfinity from "./SpinnerInfinity";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost"
  | "link"
  | "link-underline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  shape?: "default" | "circle";
  loading?: boolean;
  fullWidth?: boolean;
  as?: React.ElementType;
  href?: string;
}

// Las variantes de CONTROL (no-link) son una superficie de botón; las link son texto navegable.
// Arrays MUTABLES (no `as const`): `compoundVariants.variant` de tailwind-variants espera un array mutable.
const CONTROL: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "danger",
  "ghost",
];
const LINK: ButtonVariant[] = ["link", "link-underline"];

// Clases por eje, definidas como constantes: fuente ÚNICA del contrato `tv` (abajo) Y de `buttonSpecs`
// (el panel de documentación del catálogo). El estilo específico de cada variante:
const VARIANT_CLASSES = {
  primary:
    "bg-surface-inverse text-content-inverse border border-border-strong transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50",
  secondary:
    "bg-surface-tertiary text-content-secondary border border-border-strong transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50",
  outline:
    "bg-transparent text-content-primary border border-border-components transition-colors hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50",
  danger:
    "bg-transparent text-error border border-error-border transition-colors hover:bg-error-bg disabled:pointer-events-none disabled:opacity-50",
  // ghost: superficie de control (lleva la caja) pero SIN relleno ni borde visible — texto quieto que gana
  // fondo al hover. `border border-transparent` conserva la geometría de las variantes con borde (alinea en un
  // grupo). Para toolbars, el segmento inactivo de SegmentedControl, o el look "ghost" que IconButton hace a mano.
  ghost:
    "bg-transparent text-content-secondary border border-transparent transition-colors hover:bg-surface-subtle hover:text-content-primary disabled:pointer-events-none disabled:opacity-50",
  link: "bg-transparent text-content-primary/75 border-0 transition-colors hover:text-content-primary disabled:pointer-events-none disabled:opacity-50",
  "link-underline":
    "bg-transparent text-content-primary/75 border-0 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted disabled:pointer-events-none disabled:opacity-50",
} as const;
// El texto por tamaño (compartido por control y link):
const SIZE_TEXT = {
  sm: "text-caption font-normal",
  md: "text-body font-normal",
  lg: "text-h3 font-normal",
} as const;
// La caja del control por tamaño (padding + radio + alto) — SOLO variantes de control:
const CONTROL_BOX = {
  sm: "px-4 py-1.5 rounded-md h-8",
  md: "px-6 py-2.5 rounded-md h-10",
  lg: "px-8 py-3 rounded-md h-12",
} as const;
const ROOT_BASE =
  "relative items-center justify-center gap-2 whitespace-nowrap";
// Forma circular (redondo/pill auto-width): override con `!important` sobre la caja de control — convención
// del DS para overrides (ECO-166). Promueve el hack de `className` a eje `shape` de primera clase.
const CIRCLE_SHAPE = "h-9! w-9! min-w-0! rounded-full! px-0!";

// Contrato de variante del DS (design-system-quality / ADR-029): tailwind-variants con slots.
// Button es la pieza de REFERENCIA — todo primitivo/compuesto declara sus variantes con este contrato
// (base + variants + compoundVariants + defaultVariants + slots), nunca con mapas sueltos ni ternarios ad-hoc.
//
// Slots (partes del DOM): root = la superficie del control · label = el contenido · spinner = overlay de carga.
// El eje `size` lleva SOLO el texto (compartido por control y link); la caja del control (padding/alto/radio)
// y el display se aplican por compoundVariant según la clase de variante — así las link no heredan la caja.
export const button = tv(
  {
    slots: {
      root: ROOT_BASE,
      label: "inline-flex items-center gap-2",
      spinner: "absolute inset-0 flex items-center justify-center",
    },
    variants: {
      variant: {
        primary: { root: VARIANT_CLASSES.primary },
        secondary: { root: VARIANT_CLASSES.secondary },
        outline: { root: VARIANT_CLASSES.outline },
        danger: { root: VARIANT_CLASSES.danger },
        ghost: { root: VARIANT_CLASSES.ghost },
        link: { root: VARIANT_CLASSES.link },
        "link-underline": { root: VARIANT_CLASSES["link-underline"] },
      },
      size: {
        sm: { root: SIZE_TEXT.sm },
        md: { root: SIZE_TEXT.md },
        lg: { root: SIZE_TEXT.lg },
      },
      fullWidth: { true: {}, false: {} },
      loading: { true: { label: "opacity-30" }, false: {} },
      // Forma: eje ORTOGONAL al color y al tamaño (se compone con ellos). `circle` = redondo/pill auto-width,
      // funciona con texto o icono. Fidelidad: mismas clases que el hack `className` previo.
      shape: { default: {}, circle: { root: CIRCLE_SHAPE } },
    },
    compoundVariants: [
      // Caja del control (padding + radio + alto) por tamaño — SOLO para variantes de control (las link no).
      { variant: CONTROL, size: "sm", class: { root: CONTROL_BOX.sm } },
      { variant: CONTROL, size: "md", class: { root: CONTROL_BOX.md } },
      { variant: CONTROL, size: "lg", class: { root: CONTROL_BOX.lg } },
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
      shape: "default",
      fullWidth: true,
      loading: false,
    },
  },
  {
    // twMerge OFF: el DS resuelve overrides con `!important` (p.ej. el circular `h-9!`), NO con twMerge — que
    // colapsaría tokens custom del DS con prefijo `text-*` (dropea `text-content-*` de color al convivir con
    // `text-body` de tamaño). Sin merge concatena, fiel a la versión previa. Convención del contrato de variante.
    twMerge: false,
  },
);

export type ButtonVariants = VariantProps<typeof button>;

// Superficie de documentación del catálogo (convención `<name>Specs`, consumida por ComponentShowcase):
// las clases del contrato por eje, derivadas de las MISMAS constantes que alimentan `button` (single-source).
export const buttonSpecs = {
  base: ROOT_BASE,
  variants: VARIANT_CLASSES,
  sizes: {
    sm: `${CONTROL_BOX.sm} ${SIZE_TEXT.sm}`,
    md: `${CONTROL_BOX.md} ${SIZE_TEXT.md}`,
    lg: `${CONTROL_BOX.lg} ${SIZE_TEXT.lg}`,
  },
  shapes: { default: "", circle: CIRCLE_SHAPE },
} as const;

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  shape = "default",
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
    shape,
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
