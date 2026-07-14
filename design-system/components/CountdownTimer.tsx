// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
/**
 * CountdownTimer — animated digit boxes for countdown display.
 *
 * Each digit renders inside a small box with tabular-nums font.
 * When a digit value changes, React remounts the inner <span> via key,
 * triggering a vertical slide-in animation (countdown-slide keyframe).
 *
 * Displays MM:SS when minutes > 0, otherwise just SS.
 *
 * Usage: <CountdownTimer seconds={120} />
 * Usage: <CountdownTimer seconds={120} variant="warning" size="lg" />
 */
import { tv } from "tailwind-variants";

type CountdownVariant = "error" | "warning";
type CountdownSize = "sm" | "md" | "lg";

// Multi-slot (root / digit / sep). variant → color; size → dimensiones + separación. Raw-concat previo →
// twMerge:false (convención Button/Badge/Avatar; conserva el conjunto de clases fiel).
export const countdownTimer = tv(
  {
    slots: {
      root: "inline-flex shrink-0 items-center",
      digit:
        "inline-flex items-center justify-center overflow-hidden font-normal tabular-nums",
      sep: "font-semibold",
    },
    variants: {
      variant: {
        error: { digit: "bg-error-bg text-error", sep: "text-error/75" },
        warning: { digit: "bg-warning-bg text-warning", sep: "text-warning" },
      },
      size: {
        sm: {
          root: "gap-px",
          digit: "w-[1.25em] h-[1.5em] text-caption rounded-[3px]",
          sep: "text-caption mx-px",
        },
        md: {
          root: "gap-0.5",
          digit: "w-6 h-8 text-h3 rounded-md",
          sep: "text-h3 mx-0.5",
        },
        lg: {
          root: "gap-1",
          digit: "w-8 h-10 text-h1 rounded-lg",
          sep: "text-h1 mx-1",
        },
      },
    },
    defaultVariants: { variant: "error", size: "sm" },
  },
  { twMerge: false },
);

// Superficie de docs (single-source): reemplaza los mapas; enumera slots + ejes (las clases viven en el tv).
export const countdownTimerSpecs = {
  slots: ["root", "digit", "sep"],
  variants: ["error", "warning"],
  sizes: ["sm", "md", "lg"],
} as const;

function DigitBox({ value, className }: { value: string; className: string }) {
  return (
    <span className={className}>
      <span key={value} className="countdown-slide">
        {value}
      </span>
    </span>
  );
}

export default function CountdownTimer({
  seconds,
  variant = "error",
  size = "sm",
}: {
  seconds: number;
  variant?: CountdownVariant;
  size?: CountdownSize;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const minStr = String(mins).padStart(2, "0");
  const secStr = String(secs).padStart(2, "0");

  const { root, digit, sep } = countdownTimer({ variant, size });
  const digitClass = digit();
  const sepClass = sep();

  return (
    <span className={root()}>
      {mins > 0 && (
        <>
          <DigitBox value={minStr[0]} className={digitClass} />
          <DigitBox value={minStr[1]} className={digitClass} />
          <span className={sepClass}>:</span>
        </>
      )}
      <DigitBox value={secStr[0]} className={digitClass} />
      <DigitBox value={secStr[1]} className={digitClass} />
    </span>
  );
}
