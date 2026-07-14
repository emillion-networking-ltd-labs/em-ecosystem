// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  /**
   * Color del spinner. `default` = tokens (border-strong / content-primary), para loading de datos/secciones.
   * `current` = hereda `currentColor` (border-current) — para contexto de botón coloreado (p.ej. un IconButton
   * `danger` en loading → spinner rojo). @default "default"
   */
  tone?: "default" | "current";
  className?: string;
};

const sizeClasses = {
  sm: "h-4 w-4 border-[var(--border-width-sm)]",
  md: "h-6 w-6 border-[var(--border-width-md)]",
  lg: "h-8 w-8 border-[var(--border-width-lg)]",
};

const toneClasses = {
  default: "border-border-strong border-t-content-primary",
  current: "border-current/20 border-t-current",
};

export const spinnerCircleSpecs = {
  type: "Circular border animation — data/section loading",
  sizes: {
    sm: "16px (h-4 w-4 border-[var(--border-width-sm)]) — inline (inputs)",
    md: "24px (h-6 w-6 border-[var(--border-width-md)]) — section loading (tables, cards)",
    lg: "32px (h-8 w-8 border-[var(--border-width-lg)]) — large sections",
  },
  tones: {
    default: "border-border-strong border-t-content-primary",
    current:
      "border-current/20 border-t-current — hereda el color del contexto (botón)",
  },
  base: "animate-spin rounded-full",
  delayPattern:
    "300ms delay before showing — prevents flash on fast responses. Use showSpinner state with setTimeout.",
};

export default function SpinnerCircle({
  size = "md",
  tone = "default",
  className = "",
}: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full ${toneClasses[tone]} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
