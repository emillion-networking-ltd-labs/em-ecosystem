"use client";

import { useState, useId, useRef, useEffect, useCallback } from "react";

export type TooltipPosition = "top" | "bottom" | "left" | "right" | "auto";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: TooltipPosition;
  maxWidth?: number;
}

export const tooltipSpecs = {
  container:
    "max-w-[241px] rounded-lg border border-border-components bg-surface-primary px-4 py-3",
  text: "text-caption font-normal text-content-primary",
  arrow:
    "h-[8px] w-[8px] rotate-45 border border-border-components bg-surface-primary",
  positions: {
    "top (default)": "bottom-full, centered, mb-2",
    bottom: "top-full, centered, mt-2",
    left: "right-full, centered, mr-2",
    right: "left-full, centered, ml-2",
    auto: "Detects viewport edges — picks best position automatically",
  },
};

const positionClasses: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export const arrowClasses: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-[3px]",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-[3px]",
  left: "left-full top-1/2 -translate-y-1/2 -ml-[3px]",
  right: "right-full top-1/2 -translate-y-1/2 -mr-[3px]",
};

/**
 * Detect best position based on available viewport space.
 * Measures the wrapper element and picks the direction with most room.
 */
function detectBestPosition(
  wrapperRect: DOMRect,
  tooltipW: number,
  tooltipH: number,
): "top" | "bottom" | "left" | "right" {
  const gap = 12;
  const spaceTop = wrapperRect.top;
  const spaceBottom = window.innerHeight - wrapperRect.bottom;
  const spaceLeft = wrapperRect.left;
  const spaceRight = window.innerWidth - wrapperRect.right;

  // Prefer top/bottom (vertical) over left/right (horizontal)
  const fitsTop = spaceTop > tooltipH + gap;
  const fitsBottom = spaceBottom > tooltipH + gap;
  const fitsLeft = spaceLeft > tooltipW + gap;
  const fitsRight = spaceRight > tooltipW + gap;

  if (fitsTop) return "top";
  if (fitsBottom) return "bottom";
  if (fitsRight) return "right";
  if (fitsLeft) return "left";

  // Fallback: pick direction with most space
  const max = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
  if (max === spaceTop) return "top";
  if (max === spaceBottom) return "bottom";
  if (max === spaceRight) return "right";
  return "left";
}

export default function Tooltip({
  children,
  content,
  position = "top",
  maxWidth = 241,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [resolved, setResolved] = useState<"top" | "bottom" | "left" | "right">(
    position === "auto" ? "top" : position,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    if (position !== "auto" || !wrapperRef.current) {
      if (position !== "auto") setResolved(position);
      return;
    }
    const rect = wrapperRef.current.getBoundingClientRect();
    // Estimate tooltip size (use maxWidth and ~40px height as default)
    const tooltipEl = tooltipRef.current;
    const w = tooltipEl?.offsetWidth || maxWidth;
    const h = tooltipEl?.offsetHeight || 40;
    setResolved(detectBestPosition(rect, w, h));
  }, [position, maxWidth]);

  useEffect(() => {
    if (visible) updatePosition();
  }, [visible, updatePosition]);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <div aria-describedby={visible ? tooltipId : undefined}>{children}</div>

      {visible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded-lg border border-border-components bg-surface-primary px-4 py-3 ${positionClasses[resolved]}`}
          style={{ maxWidth }}
        >
          {typeof content === "string" ? (
            <p className="text-caption font-normal text-content-primary">
              {content}
            </p>
          ) : (
            content
          )}
          <div
            className={`absolute h-[8px] w-[8px] rotate-45 border border-border-components bg-surface-primary ${arrowClasses[resolved]}`}
          />
        </div>
      )}
    </div>
  );
}
