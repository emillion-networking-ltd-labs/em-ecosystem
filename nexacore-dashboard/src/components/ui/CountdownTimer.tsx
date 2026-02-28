/**
 * CountdownTimer — animated digit boxes for countdown display.
 * Replicates DaisyUI `countdown` as inline digit boxes + CSS @keyframes.
 *
 * Each digit renders inside a small box with tabular-nums font.
 * When a digit value changes, React remounts the inner <span> via key,
 * triggering a vertical slide-in animation (countdown-slide keyframe).
 *
 * Displays MM:SS when minutes > 0, otherwise just SS.
 * Uses error color tokens (designed for rate-limit / lockout banners).
 *
 * Usage: <CountdownTimer seconds={120} />
 */

function DigitBox({ value }: { value: string }) {
  return (
    <span className="countdown-digit">
      <span key={value} className="countdown-slide">{value}</span>
    </span>
  );
}

export default function CountdownTimer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const minStr = String(mins).padStart(2, '0');
  const secStr = String(secs).padStart(2, '0');

  return (
    <span className="inline-flex shrink-0 items-center gap-px">
      {mins > 0 && (
        <>
          <DigitBox value={minStr[0]} />
          <DigitBox value={minStr[1]} />
          <span className="mx-px text-[10px] font-bold text-error/60">:</span>
        </>
      )}
      <DigitBox value={secStr[0]} />
      <DigitBox value={secStr[1]} />
    </span>
  );
}
