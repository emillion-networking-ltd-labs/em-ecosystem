/**
 * Decorative background grid lines for auth pages.
 * Figma: "Frame BG Lines" layer inside Auth frames.
 *
 * Positions are derived from the Figma 1440×1024 artboard and
 * converted to percentages so they scale with the viewport.
 * Stroke: #000000 at 5% opacity, 1px — matches var(--border-default).
 */
export default function AuthGridLines() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Horizontal lines */}
      <div className="absolute left-0 right-0 top-[9.47%] h-px bg-content-primary/8" />
      <div className="absolute left-0 right-0 top-[86.91%] h-px bg-content-primary/8" />

      {/* Vertical lines */}
      <div className="absolute bottom-0 left-[10.35%] top-0 w-px bg-content-primary/8" />
      <div className="absolute bottom-0 left-[13.13%] top-0 w-px bg-content-primary/8" />
      <div className="absolute bottom-0 left-[19.93%] top-0 w-px bg-content-primary/8" />
      <div className="absolute bottom-0 left-[80%] top-0 w-px bg-content-primary/8" />
      <div className="absolute bottom-0 left-[81.94%] top-0 w-px bg-content-primary/8" />
      <div className="absolute bottom-0 left-[93.82%] top-0 w-px bg-content-primary/8" />
    </div>
  );
}
