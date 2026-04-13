"use client";

import { AlertTriangle, CircleX, Info, CircleCheck } from "lucide-react";

type AlertBoxVariant = "warning" | "error" | "info" | "success";

const variantConfig = {
  warning: {
    border: "border-warning-border",
    bg: "bg-warning-bg",
    icon: AlertTriangle,
    iconColor: "text-warning",
  },
  error: {
    border: "border-error-border",
    bg: "bg-error-bg",
    icon: CircleX,
    iconColor: "text-error",
  },
  info: {
    border: "border-info-border",
    bg: "bg-info-bg",
    icon: Info,
    iconColor: "text-info",
  },
  success: {
    border: "border-success-border",
    bg: "bg-success-bg",
    icon: CircleCheck,
    iconColor: "text-success",
  },
};

export const alertBoxSpecs = {
  variants: {
    warning: "border-warning-border bg-warning-bg — AlertTriangle text-warning",
    error: "border-error-border bg-error-bg — CircleX text-error",
    info: "border-info-border bg-info-bg — Info text-info",
    success: "border-success-border bg-success-bg — CircleCheck text-success",
  },
  layout: {
    container: "rounded-lg border p-3 flex items-start gap-2",
    icon: "mt-0.5 shrink-0 16px — color matches variant (text-warning/error/info/success)",
    text: "text-caption text-content-primary",
  },
};

interface AlertBoxProps {
  variant: AlertBoxVariant;
  children: React.ReactNode;
  className?: string;
}

export default function AlertBox({
  variant,
  children,
  className = "",
}: AlertBoxProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-start gap-2 rounded-lg border ${config.border} ${config.bg} p-3 ${className}`}
      role="alert"
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${config.iconColor}`} />
      <div className="text-caption text-content-primary">{children}</div>
    </div>
  );
}
