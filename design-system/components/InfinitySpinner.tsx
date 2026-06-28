/**
 * InfinitySpinner — button loading indicator.
 * Replicates DaisyUI `loading-infinity` as inline SVG + CSS @keyframes.
 *
 * All values extracted directly from DaisyUI v5 source:
 *   viewBox:         0 0 100 100  (square — matches DaisyUI aspect-square)
 *   path:            figure-8 S-curve lemniscate (extracted from DaisyUI SVG data URI)
 *   strokeDasharray: 205.271 51.318  (dash ≈80% of path, gap ≈20%)
 *   animation:       dashoffset 0 → 256.589 (= 205.271 + 51.318) over 2s linear
 *   transform:       scale(0.8) origin(50px 50px) — matches DaisyUI padding
 *
 * Sizes match DaisyUI v5 loading size scale (square px values):
 *   xs=16  sm=20  md=24  lg=28  xl=32
 *
 * vectorEffect="non-scaling-stroke" + strokeWidth="2" → exactly 2px stroke
 * at every size, immune to viewBox and CSS transform scaling.
 *
 * Usage: <InfinitySpinner /> or <InfinitySpinner size="lg" />
 */

// Only md/lg are exposed: at sm the figure-8 is too small to read the animation (ECO-91).
type SpinnerSize = "md" | "lg";

export const infinitySpinnerSpecs = {
  type: "Figure-8 lemniscate — used inside buttons",
  sizes: { md: "24px", lg: "32px" },
  base: "SVG dashoffset animation 2s linear, stroke=currentColor",
};

const SIZES: Record<SpinnerSize, number> = {
  md: 24,
  lg: 32,
};

export default function InfinitySpinner({
  size = "md",
}: {
  size?: SpinnerSize;
}) {
  const px = SIZES[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      {/*
        DaisyUI path — figure-8 S-curve tracing the infinity symbol.
        Coordinates in 0 0 100 100 space. scale(0.8) around center (50,50)
        matches DaisyUI's built-in padding so the stroke doesn't clip at edges.
        strokeDasharray="205.271 51.318": long dash (80%) + short gap (20%).
        Animation shifts dashoffset by one full cycle (256.589 = 205.271 + 51.318).
      */}
      <path
        d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeDasharray="205.271 51.318"
        className="infinity-spinner scale-[0.8] origin-[50px_50px]"
      />
    </svg>
  );
}
