"use client";

import Icon from "./Icon";
import { STATUS_ICONS } from "@/lib/statusIcons";

export const inlineErrorSpecs = {
  container: "flex items-start gap-2",
  icon: "CircleX 16px shrink-0 mt-1 text-error (aligned to first line)",
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
    <div role="alert" className={`flex items-start gap-2 ${className}`}>
      <Icon
        icon={STATUS_ICONS.error}
        size="md"
        className="mt-1 shrink-0 text-error"
      />
      <span className="flex-1 text-caption leading-6 text-error">
        {message}
      </span>
    </div>
  );
}
