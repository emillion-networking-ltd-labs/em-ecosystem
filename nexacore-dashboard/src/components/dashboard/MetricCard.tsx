'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

type MetricCardProps = {
  label: string;
  value: string;
  trend: number; // percentage, positive = up, negative = down
  colorVariant: 'purple' | 'blue';
};

export default function MetricCard({ label, value, trend, colorVariant }: MetricCardProps) {
  const isPositive = trend >= 0;

  return (
    <div
      className={`rounded-2xl border border-border-default p-6 shadow-card ${
        colorVariant === 'purple' ? 'bg-metric-purple' : 'bg-metric-blue'
      }`}
    >
      <p className="text-caption text-content-primary">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-heading-lg text-content-primary">{value}</span>
        <span
          className={`flex items-center gap-1 text-caption ${
            isPositive ? 'text-success' : 'text-error'
          }`}
        >
          {isPositive ? '+' : ''}
          {trend.toFixed(2)}%
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        </span>
      </div>
    </div>
  );
}
