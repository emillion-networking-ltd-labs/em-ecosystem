"use client";

import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function ChartCard({
  title,
  action,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <div
      className={`rounded-3xl border border-border-strong bg-surface-primary p-6 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-body-sm font-semibold text-content-primary">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}
