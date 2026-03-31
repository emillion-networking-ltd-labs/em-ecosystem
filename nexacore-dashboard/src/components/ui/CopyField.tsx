"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export const copyFieldSpecs = {
  container:
    "flex items-center gap-2 rounded-lg border border-border-components bg-surface-subtle px-4 overflow-hidden",
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

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex ${sizeClasses[size]} items-center gap-2 rounded-lg border border-border-components bg-surface-subtle px-4 overflow-hidden ${className}`}
    >
      <code className="flex-1 truncate font-mono text-body leading-6 text-content-primary">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 text-content-primary/50 transition-colors hover:text-content-primary"
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <Check size={14} className="text-green-600" />
        ) : (
          <Copy size={14} />
        )}
      </button>
    </div>
  );
}
