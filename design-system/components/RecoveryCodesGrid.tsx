"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import Button from "./Button";

export const recoveryCodesGridSpecs = {
  container: "rounded-lg border border-border-components bg-surface-subtle p-4",
  grid: "grid grid-cols-2 gap-2",
  code: "flex h-10 items-center justify-center rounded-md bg-surface-primary font-mono text-body text-content-primary",
  copyButton: "Button variant=outline size=sm — copies all codes to clipboard",
};

interface RecoveryCodesGridProps {
  codes: string[];
  className?: string;
}

export default function RecoveryCodesGrid({
  codes,
  className = "",
}: RecoveryCodesGridProps) {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="rounded-lg border border-border-components bg-surface-subtle p-4">
        <div className="grid grid-cols-2 gap-2">
          {codes.map((code, i) => (
            <code
              key={i}
              className="flex h-10 items-center justify-center rounded-md bg-surface-primary font-mono text-body text-content-primary"
            >
              {code}
            </code>
          ))}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        fullWidth={false}
        onClick={copyAll}
      >
        {copied ? (
          <>
            <Check size={16} className="text-green-600" /> Copied!
          </>
        ) : (
          <>
            <Copy size={16} /> Copy all codes
          </>
        )}
      </Button>
    </div>
  );
}
