"use client";

import { useState, useEffect, useRef } from "react";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFloating, setIsFloating] = useState(false);
  const [cardRect, setCardRect] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const updateRect = () => {
      const rect = card.getBoundingClientRect();
      setCardRect({ left: rect.left, width: rect.width });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFloating(!entry.isIntersecting);
        updateRect();
      },
      { threshold: 0.1 },
    );
    observer.observe(card);

    window.addEventListener("resize", updateRect);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateRect);
    };
  }, []);

  const floatingClass =
    position === "top"
      ? "fixed top-[68px] z-30 rounded-b-xl border border-t-0 border-border-strong bg-surface-primary px-6 py-4 shadow-card"
      : "fixed bottom-0 z-30 rounded-t-xl border border-b-0 border-border-strong bg-surface-primary px-6 py-4 shadow-card";

  return (
    <div ref={cardRef} className="card-flat">
      <div
        className={`${className} ${isFloating ? floatingClass : ""}`}
        style={
          isFloating
            ? { left: cardRect.left, width: cardRect.width }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
