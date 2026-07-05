"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

// TotalUsersChart — recharts line chart inside a ChartCard (this year vs last year). Colours are brand
// tokens resolved as CSS variables (content-primary for the primary line, accent for the comparison,
// content-tertiary / border-strong for ticks and grid), so the chart follows the theme purely via the
// CSS cascade (the `.light` / `.dark` wrapper) — no useTheme, no per-instance flag. The catalog renders
// light and dark side by side by wrapping each pane in a themed div, and both work with the same tokens.
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

// Brand-token palette (CSS variables → theme-driven). recharts writes these straight to SVG
// stroke/fill attributes, which resolve the variable from the surrounding themed wrapper.
const COLORS = {
  line: "var(--color-content-primary)",
  compare: "var(--color-accent)",
  ticks: "var(--color-content-tertiary)",
  grid: "var(--color-border-default)",
};

export default function TotalUsersChart() {
  return (
    <div className="rounded-xl border border-border-strong bg-surface-primary p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-h3 font-semibold text-content-primary">Total Users</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-content-primary" />
            <span className="text-caption text-content-secondary">This year</span>
          </div>
          <span className="text-caption text-content-primary/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-caption text-content-secondary">Last year</span>
          </div>
        </div>
      </div>
      {/* React 19 + Recharts 3 ResponsiveContainer regression: height="100%" resolves to -1 on the
          first render. Pass a numeric height directly. */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: COLORS.ticks }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: COLORS.ticks }}
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
            cursor={{ stroke: "var(--color-border-default)", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="thisYear"
            name="This year"
            stroke={COLORS.line}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: COLORS.line, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="lastYear"
            name="Last year"
            stroke={COLORS.compare}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4, fill: COLORS.compare, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
