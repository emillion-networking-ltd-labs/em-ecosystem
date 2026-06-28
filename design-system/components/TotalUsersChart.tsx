"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/hooks/useTheme";

// TotalUsersChart — recharts line chart inside a ChartCard (this year vs last year). `forceDark`
// overrides the theme (used by the catalog to render light/dark); otherwise it follows useTheme.
const chartData = [
  { month: "JAN", thisYear: 10000, lastYear: 8000 },
  { month: "FEB", thisYear: 14000, lastYear: 10000 },
  { month: "MAR", thisYear: 12000, lastYear: 11000 },
  { month: "APR", thisYear: 18000, lastYear: 9000 },
  { month: "MAY", thisYear: 22000, lastYear: 12000 },
  { month: "JUN", thisYear: 26000, lastYear: 15000 },
  { month: "JUL", thisYear: 22000, lastYear: 19000 },
];

const formatYAxis = (v: number) => (v >= 1000 ? `${v / 1000}K` : String(v));

function getColors(isDark: boolean) {
  return {
    line: isDark ? "#f5f5f5" : "rgb(28, 28, 28)",
    ticks: isDark ? "rgba(245,245,245,0.5)" : "rgba(28, 28, 28, 0.5)",
    grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(28, 28, 28, 0.08)",
  };
}

export default function TotalUsersChart({
  forceDark,
}: { forceDark?: boolean } = {}) {
  const { theme } = useTheme();
  const isDark = forceDark ?? theme === "dark";
  const colors = useMemo(() => getColors(isDark), [isDark]);

  return (
    <div className="rounded-xl border border-border-strong bg-surface-primary p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-h3 font-semibold text-content-primary">Total Users</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-content-primary" />
            <span className="text-caption text-content-tertiary">This year</span>
          </div>
          <span className="text-caption text-content-primary/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#a0bce8]" />
            <span className="text-caption text-content-tertiary">Last year</span>
          </div>
        </div>
      </div>
      {/* React 19 + Recharts 3 ResponsiveContainer regression: height="100%" resolves to -1 on the
          first render. Pass a numeric height directly. */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: colors.ticks }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: colors.ticks }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="whitespace-nowrap rounded-lg border border-border-strong bg-surface-primary px-4 py-3 shadow-card">
                  <p className="mb-1 text-caption font-semibold capitalize text-content-primary">
                    {String(label).toLowerCase()}
                  </p>
                  {payload.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ background: item.color }}
                      />
                      <span className="text-caption font-normal text-content-primary">
                        {item.name}: {Number(item.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="thisYear"
            name="This year"
            stroke={colors.line}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: colors.line, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="lastYear"
            name="Last year"
            stroke="#a0bce8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4, fill: "#a0bce8", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
