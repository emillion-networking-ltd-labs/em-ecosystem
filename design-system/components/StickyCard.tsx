"use client";

// @ds-tier: decorative — DUDOSA (confirmar en cert): efecto de scroll-stack; ya token-limpia
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import IconButton from "./IconButton";

interface StickyCardProps {
  children: React.ReactNode;
  position?: "top" | "bottom";
  className?: string;
}

export default function StickyCard({
  children,
  position = "bottom",
  className = "",
}: StickyCardProps) {
  // --- position="bottom": CSS sticky + sentinel to detect stuck state ---
  if (position === "bottom") {
    return (
      <StickyCardBottom className={className}>{children}</StickyCardBottom>
    );
  }

  // --- position="top": uses StickyCardTop (hooks inside) ---
  return <StickyCardTop className={className}>{children}</StickyCardTop>;
}

/** Bottom-position variant: same fixed+minHeight pattern as Top */
function StickyCardBottom({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFloating, setIsFloating] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [cardRect, setCardRect] = useState({ left: 0, width: 0, height: 0 });

  const updateRect = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    setCardRect({ left: r.left, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFloating(!entry.isIntersecting);
        if (entry.isIntersecting) setMobileExpanded(false);
      },
      { threshold: 0.1 },
    );
    observer.observe(card);

    const resizeObserver = new ResizeObserver(() => updateRect());
    resizeObserver.observe(card);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [updateRect]);

  useEffect(() => {
    if (!isFloating) return;
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [isFloating, updateRect]);

  const floatingClass =
    "fixed bottom-0 z-30 border border-line-strong bg-surface-elevated shadow-card";

  return (
    <div
      ref={cardRef}
      className="card-flat shadow-none"
      style={isFloating ? { minHeight: cardRect.height } : undefined}
    >
      {isFloating ? (
        <>
          {/* Mobile: collapsed strip with toggle */}
          <div
            className={`sm:hidden ${floatingClass} rounded-t-xl`}
            style={{ left: cardRect.left, width: cardRect.width }}
          >
            {mobileExpanded && (
              <div className={`p-6 pb-2 ${className}`}>{children}</div>
            )}
            <div className="flex justify-center py-1">
              <IconButton
                variant="default"
                size="sm"
                icon={mobileExpanded ? ChevronDown : ChevronUp}
                onClick={() => setMobileExpanded((prev) => !prev)}
                aria-label={mobileExpanded ? "Collapse" : "Expand"}
              />
            </div>
          </div>

          {/* Desktop: always expanded */}
          <div
            className={`hidden sm:flex ${floatingClass} rounded-t-xl p-6 ${className}`}
            style={{ left: cardRect.left, width: cardRect.width }}
          >
            {children}
          </div>
        </>
      ) : (
        <div className={className}>{children}</div>
      )}
    </div>
  );
}

/** Top-position variant with IntersectionObserver + mobile collapsible strip */
function StickyCardTop({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFloating, setIsFloating] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [cardRect, setCardRect] = useState({ left: 0, width: 0, height: 0 });

  const updateRect = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    setCardRect({ left: r.left, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFloating(!entry.isIntersecting);
        if (entry.isIntersecting) setMobileExpanded(false);
      },
      { threshold: 0.1 },
    );
    observer.observe(card);

    const resizeObserver = new ResizeObserver(() => updateRect());
    resizeObserver.observe(card);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [updateRect]);

  useEffect(() => {
    if (!isFloating) return;
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [isFloating, updateRect]);

  const floatingClass =
    "fixed top-0 z-10 border border-line-strong bg-surface-elevated shadow-card";

  return (
    <div
      ref={cardRef}
      className="card-flat shadow-none"
      style={isFloating ? { minHeight: cardRect.height } : undefined}
    >
      {isFloating ? (
        <>
          {/* Mobile: collapsed strip with toggle */}
          <div
            className={`sm:hidden ${floatingClass} rounded-b-xl`}
            style={{ left: cardRect.left, width: cardRect.width }}
          >
            <div className="flex justify-center py-1">
              <IconButton
                variant="default"
                size="sm"
                icon={mobileExpanded ? ChevronUp : ChevronDown}
                onClick={() => setMobileExpanded((prev) => !prev)}
                aria-label={mobileExpanded ? "Collapse" : "Expand"}
              />
            </div>
            {mobileExpanded && (
              <div className={`px-6 pb-4 ${className}`}>{children}</div>
            )}
          </div>

          {/* Desktop: always expanded */}
          <div
            className={`hidden sm:flex ${floatingClass} rounded-b-xl p-6 ${className}`}
            style={{ left: cardRect.left, width: cardRect.width }}
          >
            {children}
          </div>
        </>
      ) : (
        <div className={className}>{children}</div>
      )}
    </div>
  );
}
