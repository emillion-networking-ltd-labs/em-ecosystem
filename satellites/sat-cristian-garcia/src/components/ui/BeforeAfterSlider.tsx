"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface Media {
  src: string;
  alt: string;
  label?: React.ReactNode;
  /** Optional inline style applied to the <Image> (e.g. { transform: 'translateX(20px)' } to shift framing) */
  imageStyle?: React.CSSProperties;
}

type Orientation = "horizontal" | "vertical";
type AspectRatio = "4/5" | "1/1" | "16/9" | "3/4";
type ObjectFit = "cover" | "contain";

interface BeforeAfterSliderProps {
  before: Media;
  after: Media;
  orientation?: Orientation;
  initialPosition?: number;
  aspectRatio?: AspectRatio;
  objectFit?: ObjectFit;
  className?: string;
  children?: React.ReactNode;
}

export const beforeAfterSliderSpecs = {
  container:
    "relative w-full rounded-xl overflow-hidden bg-surface-tertiary select-none touch-none",
  divider:
    "absolute bg-border-components — 1px line. Horizontal: full width, top:position%. Vertical: full height, left:position%.",
  handle:
    "40×40px rounded-full bg-surface-primary border border-border-components. Centered on divider.",
  arrows:
    "h-4 w-4 svg. Horizontal: vertical arrows (⇅). Vertical: horizontal arrows (⇄, via 90deg rotate).",
  clipPath: {
    horizontal: {
      before:
        "inset(0 0 ${100-position}% 0) — on the BEFORE image + before.label",
      afterLabel: "inset(${position}% 0 0 0) — inverse, on after.label only",
    },
    vertical: {
      before:
        "inset(0 ${100-position}% 0 0) — on the BEFORE image + before.label",
      afterLabel: "inset(0 0 0 ${position}%) — inverse, on after.label only",
    },
  },
  labels: {
    "before.label":
      "Optional ReactNode rendered inside the BEFORE clip container. Clipped with the BEFORE image — visible only where BEFORE is visible.",
    "after.label":
      "Optional ReactNode rendered inside an inverse-clip container. Visible only where the AFTER image is exposed (divider past it). Not rendered if undefined.",
    children:
      "Always-visible overlay content (metadata chips, etc.). Renders above both clipped label containers.",
  },
  interaction: {
    click:
      "300ms ease-out transition on clip-path + divider position + label containers. Uses requestAnimationFrame so first click transitions smoothly before drag mode engages.",
    drag: "zero transition, direct cursor follow for immediate response.",
    listenerLifecycle:
      "Global mousemove/touchmove/mouseup/touchend attached only while isDragging === true.",
    imageDragBlock:
      "draggable={false} on <Image> + pointer-events-none on image layers + preventDefault on mouseDown + onDragStart preventDefault. Blocks native browser image drag-ghost.",
    touch:
      "touch-none on container + passive:false on touchmove to prevent page scroll during drag.",
  },
  usage:
    "Use for before/after image comparison. Three composition slots: before.label (clipped with BEFORE), after.label (clipped with AFTER), children (always visible). Labels animate in sync with the slider; children never clip.",
  objectFit:
    "Default 'cover' — image fills container, crops to match aspectRatio (ideal for photos where framing is already good). Set 'contain' when the full image must be visible without cropping (ideal for logos, diagrams, technical illustrations); empty space around the image shows bg-surface-tertiary.",
};

export default function BeforeAfterSlider({
  before,
  after,
  orientation = "horizontal",
  initialPosition = 50,
  aspectRatio = "4/5",
  objectFit = "cover",
  className = "",
  children,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct =
      orientation === "horizontal"
        ? ((clientY - rect.top) / rect.height) * 100
        : ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      } else {
        updatePosition(e.clientX, e.clientY);
      }
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, orientation]);

  const transitionStyle = isDragging
    ? "none"
    : "clip-path 300ms ease-out, top 300ms ease-out, left 300ms ease-out";

  const aspectClass = {
    "4/5": "aspect-[4/5]",
    "1/1": "aspect-square",
    "16/9": "aspect-video",
    "3/4": "aspect-[3/4]",
  }[aspectRatio];

  const cursorClass =
    orientation === "horizontal" ? "cursor-ns-resize" : "cursor-ew-resize";

  const clipPath =
    orientation === "horizontal"
      ? `inset(0 0 ${100 - position}% 0)`
      : `inset(0 ${100 - position}% 0 0)`;

  const afterLabelClipPath =
    orientation === "horizontal"
      ? `inset(${position}% 0 0 0)`
      : `inset(0 0 0 ${position}%)`;

  const dividerStyle =
    orientation === "horizontal"
      ? { top: `${position}%`, transition: transitionStyle }
      : { left: `${position}%`, transition: transitionStyle };

  const dividerClass =
    orientation === "horizontal"
      ? "pointer-events-none absolute inset-x-0 h-px bg-border-components"
      : "pointer-events-none absolute inset-y-0 w-px bg-border-components";

  return (
    <div
      ref={containerRef}
      className={`group relative ${aspectClass} w-full ${cursorClass} select-none touch-none overflow-hidden rounded-xl bg-surface-tertiary ${className}`}
      onMouseDown={(e) => {
        e.preventDefault();
        updatePosition(e.clientX, e.clientY);
        requestAnimationFrame(() => setIsDragging(true));
      }}
      onTouchStart={(e) => {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
        requestAnimationFrame(() => setIsDragging(true));
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* After — full base layer */}
      <Image
        src={after.src}
        alt={after.alt}
        fill
        draggable={false}
        className={`pointer-events-none ${objectFit === "contain" ? "object-contain" : "object-cover"}`}
        sizes="(max-width:768px) 100vw, 50vw"
        style={after.imageStyle}
      />

      {/* Before — clipped by position. translateZ(0) forces GPU compositing layer
          on initial render so text inside backdrop-blur badges renders sharp from
          the start (without it, text appears blurry until first interaction). */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath,
          transition: transitionStyle,
          transform: "translateZ(0)",
        }}
      >
        <Image
          src={before.src}
          alt={before.alt}
          fill
          draggable={false}
          className={`pointer-events-none ${objectFit === "contain" ? "object-contain" : "object-cover"}`}
          sizes="(max-width:768px) 100vw, 50vw"
          style={before.imageStyle}
        />
        {before.label}
      </div>

      {/* After label — inverse-clipped so it shows only where the AFTER image is exposed.
          translateZ(0) forces GPU compositing layer for sharp text rendering on first paint. */}
      {after.label && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            clipPath: afterLabelClipPath,
            transition: transitionStyle,
            transform: "translateZ(0)",
          }}
        >
          {after.label}
        </div>
      )}

      {/* Divider + handle */}
      <div className={dividerClass} style={dividerStyle}>
        <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border-components bg-surface-primary">
          <svg
            className={`h-4 w-4 text-content-primary/50 transition-colors group-hover:text-content-primary ${
              orientation === "vertical" ? "rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 8l5-5 5 5M7 16l5 5 5-5"
            />
          </svg>
        </div>
      </div>

      {/* Consumer-provided overlays (Badges, labels, etc.) */}
      {children}
    </div>
  );
}
