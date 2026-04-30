"use client";

import { AlertTriangle } from "lucide-react";

export const inlineErrorSpecs = {
  container: "flex items-center gap-2",
  icon: "AlertTriangle 16px shrink-0 text-error",
  text: "flex-1 text-caption leading-6 text-error",
};

interface InlineErrorProps {
  message: string;
  className?: string;
}

export default function InlineError({
  message,
  className = "",
}: InlineErrorProps) {
  if (!message) return null;
  return (
    <div role="alert" className={`flex items-center gap-2 ${className}`}>
      <AlertTriangle size={16} className="shrink-0 text-error" />
      <span className="flex-1 text-caption leading-6 text-error">
        {message}
      </span>
    </div>
  );
}
