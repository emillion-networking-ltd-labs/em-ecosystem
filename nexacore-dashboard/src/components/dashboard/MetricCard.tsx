"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  trend?: number; // percentage, positive = up, negative = down
  colorVariant: "purple" | "blue";
  loading?: boolean;
};

export default function MetricCard({
  label,
  value,
  trend,
  colorVariant,
  loading,
}: MetricCardProps) {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <div
      className={`rounded-2xl border border-border-default p-6 ${
        colorVariant === "purple" ? "bg-metric-purple" : "bg-metric-blue"
      }`}
    >
      <p className="text-caption text-content-primary">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-lg bg-black/[0.08] dark:bg-white/[0.08]" />
        ) : (
          <>
            <span className="text-heading text-content-primary">{value}</span>
            {trend !== undefined && (
              <span
                className={`flex items-center gap-1 text-caption ${
                  isPositive ? "text-success" : "text-error"
                }`}
              >
                {isPositive ? "+" : ""}
                {trend.toFixed(2)}%
                {isPositive ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
