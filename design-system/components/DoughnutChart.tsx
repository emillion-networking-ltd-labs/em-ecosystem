"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

// DoughnutChart — recharts Pie (donut) with a legend. `forceDark` overrides the theme for the one
// theme-dependent slice color (used by the catalog to render light/dark side by side); in the app it
// can be derived from the real theme.
export interface DoughnutDatum {
  name: string;
  value: number;
  fill: string;
}

function defaultData(isDark: boolean): DoughnutDatum[] {
  return [
    { name: "USER", value: 150, fill: "#a0bce8" },
    { name: "ADMIN", value: 75, fill: "#6be6d3" },
    { name: "SUPERADMIN", value: 25, fill: isDark ? "#f5f5f5" : "#1c1c1c" },
  ];
}

export default function DoughnutChart({
  title = "Users by Role",
  data,
  forceDark = false,
}: {
  title?: string;
  data?: DoughnutDatum[];
  forceDark?: boolean;
}) {
  const chartData = data ?? defaultData(forceDark);
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-border-strong bg-surface-primary p-6">
      <div className="mb-4">
        <h3 className="text-body font-semibold text-content-primary">{title}</h3>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="h-[120px] w-[120px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((e) => (
                  <Cell key={e.name} fill={e.fill} />
                ))}
              </Pie>
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className="whitespace-nowrap rounded-lg border border-border-components bg-surface-primary px-4 py-3 shadow-card">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-sm"
                          style={{ background: item.payload?.fill || item.color }}
                        />
                        <span className="text-caption font-normal text-content-primary">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {chartData.map(({ name, value, fill }) => (
            <div key={name} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: fill }} />
              <span className="text-caption text-content-primary">{name}</span>
              <span className="text-caption text-content-tertiary">
                {value} ({((value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
