"use client";

import { AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export const emptyStateSpecs = {
  container: "flex flex-col items-center gap-3 py-12",
  "icon (variant=default)": "48px text-content-primary/30 (default: Inbox)",
  "icon (variant=error)": "48px text-error (default: AlertTriangle)",
  title: "text-body font-semibold text-content-primary",
  description: "text-caption text-content-secondary text-center",
  action: "Optional ReactNode (Button, Link, etc.)",
};

interface EmptyStateProps {
  variant?: "default" | "error";
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const isError = variant === "error";
  const defaultIcon = isError ? (
    <AlertTriangle size={48} />
  ) : (
    <Inbox size={48} />
  );
  const iconColorClass = isError ? "text-error" : "text-content-primary/30";

  return (
    <div className={`flex flex-col items-center gap-3 py-12 ${className}`}>
      <span className={iconColorClass}>{icon || defaultIcon}</span>
      <p className="text-body font-semibold text-content-primary">{title}</p>
      {description && (
        <p className="text-caption text-content-secondary text-center">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
