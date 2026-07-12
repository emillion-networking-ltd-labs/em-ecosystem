"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import Icon from "./Icon";

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
      className={`rounded-xl border border-border-default p-6 ${
        colorVariant === "purple" ? "bg-metric-purple" : "bg-metric-blue"
      }`}
    >
      <p className="text-body font-semibold text-content-secondary">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-lg bg-black/8 dark:bg-white/8" />
        ) : (
          <>
            <span className="text-h1 text-content-primary">{value}</span>
            {trend !== undefined && (
              <span
                className={`flex items-center gap-1 text-caption ${
                  isPositive ? "text-success" : "text-error"
                }`}
              >
                {isPositive ? "+" : ""}
                {trend.toFixed(2)}%
                {isPositive ? (
                  <Icon icon={TrendingUp} size="md" />
                ) : (
                  <Icon icon={TrendingDown} size="md" />
                )}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
