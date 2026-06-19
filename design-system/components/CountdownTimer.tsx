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

type CountdownVariant = "error" | "warning";
type CountdownSize = "sm" | "lg";

const variantStyles: Record<
  CountdownVariant,
  { digitBg: string; digitText: string; sepText: string }
> = {
  error: {
    digitBg: "bg-error-bg",
    digitText: "text-error",
    sepText: "text-error/60",
  },
  warning: {
    digitBg: "bg-warning-bg",
    digitText: "text-warning",
    sepText: "text-warning",
  },
};

const sizeStyles: Record<
  CountdownSize,
  { digit: string; sep: string; gap: string }
> = {
  sm: {
    digit: "w-[1.25em] h-[1.5em] text-[11px] rounded-[3px]",
    sep: "text-caption mx-px",
    gap: "gap-px",
  },
  lg: {
    digit: "w-8 h-10 text-2xl rounded-lg",
    sep: "text-2xl mx-1",
    gap: "gap-1",
  },
};

function DigitBox({ value, className }: { value: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden font-semibold tabular-nums ${className}`}
    >
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

  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const digitClass = `${v.digitBg} ${v.digitText} ${s.digit}`;
  const sepClass = `${v.sepText} ${s.sep} font-semibold`;

  return (
    <span className={`inline-flex shrink-0 items-center ${s.gap}`}>
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
