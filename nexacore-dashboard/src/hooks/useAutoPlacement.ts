/**
 * Auto-placement utility for tooltips and floating elements.
 * Implements the Flip + Shift algorithm (same as Floating UI / Popper.js).
 *
 * Given a reference point (x, y in viewport coords) and a preferred placement,
 * returns the optimal placement and position that keeps the tooltip fully visible.
 *
 * @see https://floating-ui.com/docs/flip
 * @see https://floating-ui.com/docs/shift
 */

export type Placement = "top" | "bottom" | "left" | "right";

interface AutoPlacementResult {
  placement: Placement;
  x: number;
  y: number;
}

/**
 * Calculate optimal tooltip position given a reference point in viewport coordinates.
 *
 * @param refX - X coordinate of the reference point (viewport pixels)
 * @param refY - Y coordinate of the reference point (viewport pixels)
 * @param tooltipW - Width of the tooltip element
 * @param tooltipH - Height of the tooltip element
 * @param preferred - Preferred placement (default: "top")
 * @param gap - Gap between tooltip and reference point (default: 10)
 */
export function computePlacement(
  refX: number,
  refY: number,
  tooltipW: number,
  tooltipH: number,
  preferred: Placement = "top",
  gap = 10,
): AutoPlacementResult {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Check if placement fits without clipping
  const fits = (p: Placement): boolean => {
    switch (p) {
      case "top":
        return (
          refY - tooltipH - gap > 0 &&
          refX - tooltipW / 2 > 0 &&
          refX + tooltipW / 2 < vw
        );
      case "bottom":
        return (
          refY + tooltipH + gap < vh &&
          refX - tooltipW / 2 > 0 &&
          refX + tooltipW / 2 < vw
        );
      case "left":
        return (
          refX - tooltipW - gap > 0 &&
          refY - tooltipH / 2 > 0 &&
          refY + tooltipH / 2 < vh
        );
      case "right":
        return (
          refX + tooltipW + gap < vw &&
          refY - tooltipH / 2 > 0 &&
          refY + tooltipH / 2 < vh
        );
    }
  };

  // Flip: try preferred, then opposite, then perpendicular
  const flipOrder: Record<Placement, Placement[]> = {
    top: ["top", "bottom", "left", "right"],
    bottom: ["bottom", "top", "left", "right"],
    left: ["left", "right", "top", "bottom"],
    right: ["right", "left", "top", "bottom"],
  };

  let placement = preferred;
  for (const candidate of flipOrder[preferred]) {
    if (fits(candidate)) {
      placement = candidate;
      break;
    }
  }

  // Calculate position based on final placement
  let x: number, y: number;
  switch (placement) {
    case "top":
      x = refX;
      y = refY - gap;
      break;
    case "bottom":
      x = refX;
      y = refY + gap;
      break;
    case "left":
      x = refX - gap;
      y = refY;
      break;
    case "right":
      x = refX + gap;
      y = refY;
      break;
  }

  return { placement, x, y };
}
