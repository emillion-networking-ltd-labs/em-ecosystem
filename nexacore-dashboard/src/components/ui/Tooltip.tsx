"use client";

import { useState, useId } from "react";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const tooltipSpecs = {
  container:
    "max-w-[241px] rounded-lg border border-border-strong bg-surface-primary px-4 py-3",
  text: "text-caption font-normal text-content-primary",
  arrow:
    "h-[8px] w-[8px] rotate-45 border border-border-strong bg-surface-primary",
  positions: {
    "top (default)": "bottom-full, centered, mb-2",
    bottom: "top-full, centered, mt-2",
    left: "right-full, centered, mr-2",
    right: "left-full, centered, ml-2",
  },
};

const positionClasses: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-[3px]",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-[3px]",
  left: "left-full top-1/2 -translate-y-1/2 -ml-[3px]",
  right: "right-full top-1/2 -translate-y-1/2 -mr-[3px]",
};

export default function Tooltip({
  children,
  content,
  position = "top",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <div aria-describedby={visible ? tooltipId : undefined}>{children}</div>

      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 max-w-[241px] rounded-lg border border-border-strong bg-surface-primary px-4 py-3 ${positionClasses[position]}`}
        >
          <p className="text-caption font-normal text-content-primary">
            {content}
          </p>
          <div
            className={`absolute h-[8px] w-[8px] rotate-45 border border-border-strong bg-surface-primary ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}
