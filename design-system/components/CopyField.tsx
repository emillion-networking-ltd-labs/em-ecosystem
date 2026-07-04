"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import Tooltip from "./Tooltip";
import { useIsTruncated } from "@/hooks/useIsTruncated";

export const copyFieldSpecs = {
  container:
    "flex items-center gap-2 rounded-lg border border-border-strong bg-surface-subtle px-4 overflow-hidden",
  code: "flex-1 truncate font-mono text-body leading-6 text-content-primary",
  copyButton:
    "shrink-0 text-content-primary/50 transition-colors hover:text-content-primary",
  icon: "Copy/Check 14px — toggles on click, reverts after 2s",
  sizes: {
    "md (default)": "h-12 (48px)",
    sm: "h-10 (40px)",
  },
};

const sizeClasses = {
  sm: "h-10",
  md: "h-12",
};

interface CopyFieldProps {
  value: string;
  size?: "sm" | "md";
  className?: string;
}

export default function CopyField({
  value,
  size = "md",
  className = "",
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const [codeRef, truncated] = useIsTruncated<HTMLElement>();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ECO-118/129: el tooltip con el valor completo va sobre TODO el campo (position="auto") y SOLO cuando el
  // <code> TRUNCA (no cabe → useIsTruncated); si el valor se ve entero, no sale tooltip. El botón de copiar
  // da su feedback con el icono (Copy→Check) + aria-label, sin tooltip propio (evita dos a la vez).
  return (
    <Tooltip content={truncated ? value : ""} position="auto">
      <div
        className={`flex ${sizeClasses[size]} items-center gap-2 rounded-lg border border-border-strong bg-surface-subtle px-4 overflow-hidden ${className}`}
      >
        <code
          ref={codeRef}
          className="flex-1 truncate font-mono text-body leading-6 text-content-primary"
        >
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-content-primary/50 transition-colors hover:text-content-primary"
          aria-label={copied ? "Copied" : "Copy to clipboard"}
        >
          {copied ? (
            <Check size={14} className="text-success" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
    </Tooltip>
  );
}
