"use client";

// @ds-tier: core — DUDOSA (confirmar en cert): data-viz de producto; color de serie exento
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";

// DoughnutChart — recharts Pie (donut) with a legend. Slice colours are data-series tokens resolved as
// CSS variables (chart-1 / chart-2 / content-primary), so the chart follows the theme purely via the CSS
// cascade (the `.light` / `.dark` wrapper) — no per-instance theme flag. The catalog renders light and
// dark side by side by wrapping each pane in a themed div, so both views work with the same tokens.
export interface DoughnutDatum {
  name: string;
  value: number;
  fill: string;
}

// Default palette: the series use the dedicated chart tokens (chart-1 / chart-2), the primary role uses
// content-primary (which itself flips with the theme). NOT accent — accent is the brand colour, not a
// data-series colour (ECO-150 / design-propagation). All are CSS variables — no raw hex.
const DEFAULT_DATA: DoughnutDatum[] = [
  { name: "USER", value: 150, fill: "var(--color-chart-1)" },
  { name: "ADMIN", value: 75, fill: "var(--color-chart-2)" },
  { name: "SUPERADMIN", value: 25, fill: "var(--color-content-primary)" },
];

export default function DoughnutChart({
  title = "Users by Role",
  data,
}: {
  title?: string;
  data?: DoughnutDatum[];
}) {
  const chartData = data ?? DEFAULT_DATA;
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard title={title}>
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
                    <div className="whitespace-nowrap rounded-lg border border-border-strong bg-surface-primary px-4 py-3 shadow-card">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-sm"
                          style={{
                            background: item.payload?.fill || item.color,
                          }}
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
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: fill }}
              />
              <span className="text-caption text-content-primary">{name}</span>
              <span className="text-caption text-content-secondary">
                {value} ({((value / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
