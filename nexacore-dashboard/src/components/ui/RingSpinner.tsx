/**
 * RingSpinner — ripple/sonar ring loading indicator.
 * Replicates DaisyUI `loading-ring` as inline SVG with SMIL animation.
 * No CSS @keyframes required — all animation is handled by SVG <animate> elements.
 *
 * All values extracted directly from DaisyUI v5 source SVG data URI:
 *   viewBox:     0 0 44 44  (square)
 *   Two circles: cx=22 cy=22, r animates 1→20, stroke-opacity animates 1→0
 *   Circle 2 offset by -0.9s (half of 1.8s) for continuous staggered ripple
 *   strokeWidth: 2  (on <g>, in SVG user units)
 *   Easing:      cubic spline via keySplines (ease-out curves)
 *
 * DaisyUI applies color via CSS mask + bg-current. Here we use stroke="currentColor"
 * so the ring inherits the element's text color (set via Tailwind text-* utilities).
 *
 * Sizes match DaisyUI v5 loading size scale (square px values):
 *   xs=16  sm=20  md=24  lg=28  xl=32
 *
 * Usage: <RingSpinner /> or <RingSpinner size="sm" />
 */

type SpinnerSize = "sm" | "md" | "lg";

const SIZES: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

export default function RingSpinner({ size = "md" }: { size?: SpinnerSize }) {
  const px = SIZES[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
    >
      {/*
        Two identical circles sharing the same center (22, 22).
        Circle 1 begins at t=0, Circle 2 begins at t=-0.9s (half-period offset).
        Together they create a continuous staggered ripple — at any moment one
        ring is expanding from the center while the other is halfway to the edge.

        Radius easing  (keySplines 0.165,0.84,0.44,1): ease-out — fast expansion that decelerates.
        Opacity easing (keySplines 0.3,0.61,0.355,1):  ease-out — quick initial fade, slow finish.
      */}
      <g fill="none" fillRule="evenodd" strokeWidth="2" stroke="currentColor">
        {/* Circle 1 — starts immediately */}
        <circle cx="22" cy="22" r="1">
          <animate
            attributeName="r"
            begin="0s"
            dur="1.8s"
            values="1;20"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.165,0.84,0.44,1"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            begin="0s"
            dur="1.8s"
            values="1;0"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.3,0.61,0.355,1"
            repeatCount="indefinite"
          />
        </circle>

        {/* Circle 2 — offset by -0.9s (half period) for staggered continuous effect */}
        <circle cx="22" cy="22" r="1">
          <animate
            attributeName="r"
            begin="-0.9s"
            dur="1.8s"
            values="1;20"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.165,0.84,0.44,1"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            begin="-0.9s"
            dur="1.8s"
            values="1;0"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.3,0.61,0.355,1"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </svg>
  );
}
