"use client";

// Fixture de fidelidad ECO-177: copia FIEL de la CAJA del Input previo (raw concat), tomada de `main`.
// Solo replica lo necesario para comparar el className de la caja (variant × size × error × disabled).
// Se retira al cerrar la pieza.

import { forwardRef } from "react";

interface InputOldProps {
  size?: "sm" | "md";
  variant?: "default" | "filled";
  error?: string;
  hasError?: boolean;
  disabled?: boolean;
}

const sizeClasses = {
  sm: "h-10 px-3 text-body",
  md: "h-12 px-4 text-body",
};

const InputOld = forwardRef<HTMLInputElement, InputOldProps>(function InputOld(
  { size = "md", variant = "default", error, hasError = false, disabled },
  ref,
) {
  const isErrorState = !!(error || hasError);
  const isFilled = variant === "filled";
  const outlineClass = isFilled
    ? "outline-hidden"
    : isErrorState
      ? "outline-error"
      : "outline-transparent hover:outline-content-secondary focus-within:outline-content-secondary";

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`
          flex items-center gap-2 rounded-lg border border-line-control
          ${isFilled ? "bg-surface-primary" : "bg-transparent outline-solid outline-2 outline-offset-2"}
          transition-colors
          ${sizeClasses[size]}
          ${outlineClass}
          ${disabled ? "cursor-not-allowed opacity-60" : "cursor-text"}
        `}
      >
        <input ref={ref} className="min-w-0 flex-1" disabled={disabled} />
      </div>
    </div>
  );
});

export default InputOld;
