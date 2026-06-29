// NumberTicker — Magic UI (MIT, © Magic UI), adoptado (ECO-101, fase 1 / ADR-019). Lógica/animación
// VERBATIM; theming adaptado a tokens del design-system (text-content-primary en vez de text-black/white)
// para seguir el tema light/dark y la marca. Cuenta animada hasta un valor (stats de marketing).
// Solo `motion` + `cn` (deps ya presentes).
"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? value : startValue);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isInView) {
      timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value);
      }, delay * 1000);
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [motionValue, isInView, delay, value, direction, startValue]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("en-US", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces)));
        }
      }),
    [springValue, decimalPlaces],
  );

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tracking-wider tabular-nums text-content-primary",
        className,
      )}
      {...props}
    >
      {startValue}
    </span>
  );
}

export default NumberTicker;
