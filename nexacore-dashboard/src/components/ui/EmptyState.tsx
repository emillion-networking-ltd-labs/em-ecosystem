"use client";

import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export const emptyStateSpecs = {
  container: "flex flex-col items-center gap-3 py-12",
  icon: "48px text-content-primary/30 (default: Inbox)",
  title: "text-body font-semibold text-content-primary",
  description: "text-caption text-content-primary/50 text-center",
  action: "Optional ReactNode (Button, Link, etc.)",
};

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center gap-3 py-12 ${className}`}>
      <span className="text-content-primary/30">
        {icon || <Inbox size={48} />}
      </span>
      <p className="text-body font-semibold text-content-primary">{title}</p>
      {description && (
        <p className="text-caption text-content-primary/50 text-center">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
