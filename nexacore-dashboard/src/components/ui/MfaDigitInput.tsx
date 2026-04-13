"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export const mfaDigitInputSpecs = {
  container: {
    base: "flex gap-2 sm:gap-3",
  },
  digit: {
    base: "rounded-lg border border-border-components bg-transparent text-center font-mono text-body text-content-primary outline outline-2 outline-offset-2 transition-colors",
    hover: "hover:outline-content-primary/75",
    focus: "focus:outline-content-primary/75",
    error: "outline-error/75 — same pattern as Input error state",
    sizing:
      "aspect-square flex-1 max-w-12 min-w-0 — auto-shrinks to fit container, max 48px",
  },
  behavior: {
    autoAdvance: "Moves to next input after digit entry",
    backspace: "Moves to previous input on backspace when empty",
    arrowKeys: "ArrowLeft/ArrowRight navigates between digits",
    paste: "Distributes pasted code across all inputs",
    inputMode: "numeric — shows number keyboard on mobile",
  },
};

interface MfaDigitInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  idPrefix?: string;
  autoFocus?: boolean;
  error?: boolean;
  className?: string;
}

const digitBase =
  "rounded-lg border border-border-components bg-transparent text-center font-mono text-body text-content-primary outline outline-2 outline-offset-2 transition-colors";

export default function MfaDigitInput({
  length = 6,
  value,
  onChange,
  onComplete,
  idPrefix = "mfa-digit",
  autoFocus = false,
  error = false,
  className = "",
}: MfaDigitInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [compact, setCompact] = useState(false);

  // md: 6 cells × 48px + 5 gaps × 12px = 348px minimum
  // sm: 6 cells × 40px + 5 gaps × 8px = 280px minimum
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 348);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleDigitChange = useCallback(
    (index: number, val: string) => {
      const digit = val.replace(/\D/g, "").slice(-1);
      const newValue = [...value];
      newValue[index] = digit;
      onChange(newValue);

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (digit && index === length - 1) {
        const code = newValue.join("");
        if (code.length === length) onComplete?.(code);
      }
    },
    [value, onChange, onComplete, length],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, length],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (!pasted) return;
      const newValue = [...value];
      for (let i = 0; i < pasted.length; i++) {
        newValue[i] = pasted[i];
      }
      onChange(newValue);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      if (pasted.length === length) onComplete?.(pasted);
    },
    [value, onChange, onComplete, length],
  );

  return (
    <div
      ref={containerRef}
      className={`flex ${compact ? "gap-2.5" : "gap-3"} ${className}`}
      role="group"
      aria-label="Verification code digits"
      onPaste={handlePaste}
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          id={i === 0 ? `${idPrefix}-0` : undefined}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleDigitChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`${compact ? "h-10 max-w-10" : "h-12 max-w-12"} min-w-0 flex-1 ${digitBase} ${error ? "outline-error/75" : "outline-transparent hover:outline-content-primary/75 focus:outline-content-primary/75"}`}
          aria-label={`Digit ${i + 1}`}
          autoFocus={autoFocus && i === 0}
        />
      ))}
    </div>
  );
}
