"use client";

import {
  useState,
  useId,
  useRef,
  useEffect,
  useCallback,
  cloneElement,
  isValidElement,
} from "react";
import { createPortal } from "react-dom";

export type TooltipPosition = "top" | "bottom" | "left" | "right" | "auto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TriggerProps = Record<string, any>;

interface TooltipProps {
  children: React.ReactElement<TriggerProps>;
  content: React.ReactNode;
  position?: TooltipPosition;
  maxWidth?: number;
}

export const tooltipSpecs = {
  container:
    "max-w-[241px] rounded-lg border border-border-components bg-surface-primary px-4 py-3",
  text: "text-caption font-normal text-content-primary",
  arrow: "h-2 w-2 rotate-45 border border-border-components bg-surface-primary",
  positions: {
    "top (default)": "above trigger, centered",
    bottom: "below trigger, centered",
    left: "left of trigger, centered",
    right: "right of trigger, centered",
    auto: "Detects viewport edges — picks best position automatically",
  },
};

const GAP = 8;

function detectBestPosition(
  rect: DOMRect,
  tooltipW: number,
  tooltipH: number,
): "top" | "bottom" | "left" | "right" {
  const spaceTop = rect.top;
  const spaceBottom = window.innerHeight - rect.bottom;
  const spaceLeft = rect.left;
  const spaceRight = window.innerWidth - rect.right;

  if (spaceTop > tooltipH + GAP) return "top";
  if (spaceBottom > tooltipH + GAP) return "bottom";
  if (spaceRight > tooltipW + GAP) return "right";
  if (spaceLeft > tooltipW + GAP) return "left";

  const max = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
  if (max === spaceTop) return "top";
  if (max === spaceBottom) return "bottom";
  if (max === spaceRight) return "right";
  return "left";
}

function getTooltipStyle(
  rect: DOMRect,
  pos: "top" | "bottom" | "left" | "right",
): React.CSSProperties {
  switch (pos) {
    case "top":
      return {
        left: rect.left + rect.width / 2,
        top: rect.top - GAP,
        transform: "translate(-50%, -100%)",
      };
    case "bottom":
      return {
        left: rect.left + rect.width / 2,
        top: rect.bottom + GAP,
        transform: "translate(-50%, 0)",
      };
    case "left":
      return {
        left: rect.left - GAP,
        top: rect.top + rect.height / 2,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        left: rect.right + GAP,
        top: rect.top + rect.height / 2,
        transform: "translate(0, -50%)",
      };
  }
}

const arrowStyles: Record<string, React.CSSProperties> = {
  top: {
    left: "50%",
    top: "100%",
    transform: "translate(-50%, -50%) rotate(45deg)",
  },
  bottom: {
    left: "50%",
    bottom: "100%",
    transform: "translate(-50%, 50%) rotate(45deg)",
  },
  left: {
    left: "100%",
    top: "50%",
    transform: "translate(-50%, -50%) rotate(45deg)",
  },
  right: {
    right: "100%",
    top: "50%",
    transform: "translate(50%, -50%) rotate(45deg)",
  },
};

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
  const [style, setStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const w = tooltipEl?.offsetWidth || maxWidth;
    const h = tooltipEl?.offsetHeight || 40;
    const pos = position === "auto" ? detectBestPosition(rect, w, h) : position;
    setResolved(pos);
    setStyle(getTooltipStyle(rect, pos));
  }, [position, maxWidth]);

  const showTooltip = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pos =
      position === "auto" ? detectBestPosition(rect, maxWidth, 40) : position;
    setResolved(pos);
    setStyle(getTooltipStyle(rect, pos));
    setVisible(true);
  }, [position, maxWidth]);

  useEffect(() => {
    if (visible) updatePosition();
  }, [visible, updatePosition]);

  // ECO-116: while open, re-anchor to the trigger on scroll/resize. The tooltip is position: fixed and
  // computed its coords once on open, so scrolling (without moving the mouse) left it detached from the
  // trigger. `capture: true` catches scroll on ANY ancestor (scrollable containers), not just the window.
  useEffect(() => {
    if (!visible) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible, updatePosition]);

  const isTouchDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  const handleEnter = useCallback(() => {
    if (isTouchDevice) return;
    if (enterTimer.current) clearTimeout(enterTimer.current);
    enterTimer.current = setTimeout(showTooltip, 200);
  }, [isTouchDevice, showTooltip]);

  const handleLeave = useCallback(() => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    enterTimer.current = null;
    setVisible(false);
  }, []);

  const tooltipEl =
    visible && !isTouchDevice ? (
      <div
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        className="fixed z-9999 w-max rounded-lg border border-border-components bg-surface-primary px-4 py-3"
        style={{ ...style, maxWidth }}
      >
        {typeof content === "string" ? (
          <p className="break-words text-caption font-normal text-content-primary">
            {content}
          </p>
        ) : (
          content
        )}
        <div
          className="absolute h-2 w-2 border border-border-components bg-surface-primary"
          style={arrowStyles[resolved]}
        />
      </div>
    ) : null;

  if (!isValidElement(children)) return children;

  // ECO-129: sin content no hay nada que mostrar → devuelve el hijo tal cual (sin comportamiento de
  // tooltip). Permite el patrón "tooltip solo cuando el texto trunca": el consumidor pasa content=""
  // cuando el valor cabe y el valor completo cuando está recortado.
  if (content === "" || content == null) return children;

  // Inject ref + event handlers directly into the child — no wrapper div (Radix pattern)
  const child = cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      handleEnter();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleLeave();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      handleEnter();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      handleLeave();
      children.props.onBlur?.(e);
    },
    "aria-describedby": visible
      ? tooltipId
      : children.props["aria-describedby"],
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <>
      {child}
      {tooltipEl &&
        typeof document !== "undefined" &&
        createPortal(tooltipEl, document.body)}
    </>
  );
}
