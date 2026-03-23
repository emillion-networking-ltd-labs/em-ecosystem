"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import ChartCard from "./ChartCard";
import { useTheme } from "@/hooks/useTheme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

ChartJS.defaults.font.family =
  "var(--font-geist-sans), system-ui, -apple-system, sans-serif";

const labels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"];
const thisYearData = [10000, 14000, 12000, 18000, 22000, 26000, 22000];
const lastYearData = [8000, 10000, 11000, 9000, 12000, 15000, 19000];
const formatYAxis = (v: number | string) => {
  const n = Number(v);
  return n >= 1000 ? `${n / 1000}K` : String(n);
};

function getChartColors(isDark: boolean) {
  return {
    line: isDark ? "#f5f5f5" : "rgb(28, 28, 28)",
    ticks: isDark ? "rgba(245,245,245,0.5)" : "rgba(28, 28, 28, 0.5)",
    grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(28, 28, 28, 0.08)",
  };
}

/* Arrow classes — identical to components/ui/Tooltip.tsx arrowClasses */
const arrowClasses: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-[3px]",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-[3px]",
  left: "left-full top-1/2 -translate-y-1/2 -ml-[3px]",
  right: "right-full top-1/2 -translate-y-1/2 -mr-[3px]",
};

type TooltipInfo = {
  /* Position of the tooltip box (px, relative to canvas) */
  x: number;
  y: number;
  /* Where the caret/arrow should point (px, relative to canvas) */
  caretX: number;
  caretY: number;
  /* Chart.js computed alignment */
  placement: "top" | "bottom" | "left" | "right";
  title: string;
  items: { label: string; value: string; color: string }[];
} | null;

/**
 * Map Chart.js xAlign/yAlign to our Tooltip placement.
 * Chart.js: yAlign=top means tooltip is ABOVE the point → our "top"
 *           yAlign=bottom means tooltip is BELOW → our "bottom"
 *           xAlign=left/right with yAlign=center → our "left"/"right"
 */
function getPlacement(
  xAlign: string,
  yAlign: string,
): "top" | "bottom" | "left" | "right" {
  if (yAlign === "bottom") return "top"; // tooltip above point
  if (yAlign === "top") return "bottom"; // tooltip below point
  if (xAlign === "right") return "left"; // tooltip left of point
  if (xAlign === "left") return "right"; // tooltip right of point
  return "top";
}

export default function TotalUsersChart({
  forceDark,
}: { forceDark?: boolean } = {}) {
  const { theme } = useTheme();
  const isDark = forceDark ?? theme === "dark";
  const colors = useMemo(() => getChartColors(isDark), [isDark]);
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo>(null);

  const data = {
    labels,
    datasets: [
      {
        label: "This year",
        data: thisYearData,
        borderColor: colors.line,
        backgroundColor: colors.line,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBorderWidth: 0,
        pointHoverBackgroundColor: colors.line,
        pointHitRadius: 20,
        tension: 0.4,
      },
      {
        label: "Last year",
        data: lastYearData,
        borderColor: "#a0bce8",
        backgroundColor: "#a0bce8",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBorderWidth: 0,
        pointHoverBackgroundColor: "#a0bce8",
        pointHitRadius: 20,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    clip: false as const,
    animations: {
      radius: { duration: 0 },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { size: 12 }, color: colors.ticks },
      },
      y: {
        grid: { color: colors.grid, drawTicks: false },
        border: { display: false, dash: [3, 3] as number[] },
        ticks: {
          font: { size: 12 },
          color: colors.ticks,
          callback: formatYAxis,
          padding: 8,
        },
      },
    },
    plugins: {
      tooltip: {
        enabled: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        external: useCallback((context: any) => {
          const { tooltip: t } = context;
          if (t.opacity === 0) {
            setTooltipInfo(null);
            return;
          }
          const title = t.title?.[0] || "";
          const items =
            t.body?.map((b: { lines: string[] }, i: number) => ({
              label: b.lines[0]?.split(":")[0] || "",
              value: b.lines[0]?.split(":")[1]?.trim() || b.lines[0] || "",
              color: t.labelColors?.[i]?.backgroundColor || "#1c1c1c",
            })) || [];

          setTooltipInfo({
            x: t.x,
            y: t.y,
            caretX: t.caretX,
            caretY: t.caretY,
            placement: getPlacement(t.xAlign || "center", t.yAlign || "bottom"),
            title,
            items,
          });
        }, []),
      },
    },
  };

  return (
    <ChartCard
      title="Total Users"
      action={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-content-primary" />
            <span className="text-caption text-content-primary/50">
              This year
            </span>
          </div>
          <span className="text-body-sm text-content-primary/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#a0bce8]" />
            <span className="text-caption text-content-primary/50">
              Last year
            </span>
          </div>
        </div>
      }
    >
      <div className="relative h-[250px] overflow-visible">
        <Line data={data} options={options} />

        {/* Custom tooltip — positioned by Chart.js coordinates, arrow from Tooltip.tsx */}
        {tooltipInfo && (
          <div
            className="absolute pointer-events-none"
            style={{ left: tooltipInfo.caretX, top: tooltipInfo.caretY }}
          >
            {/* Wrapper — same as Tooltip.tsx: relative inline-flex */}
            <div className="relative inline-flex">
              {/* Card — same classes as Tooltip.tsx */}
              <div
                role="tooltip"
                className={`absolute z-50 whitespace-nowrap rounded-lg border border-border-strong bg-surface-primary px-4 py-3 ${
                  tooltipInfo.placement === "top"
                    ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
                    : tooltipInfo.placement === "bottom"
                      ? "top-full left-1/2 -translate-x-1/2 mt-2"
                      : tooltipInfo.placement === "left"
                        ? "right-full top-1/2 -translate-y-1/2 mr-2"
                        : "left-full top-1/2 -translate-y-1/2 ml-2"
                }`}
              >
                <p className="text-caption font-semibold text-content-primary mb-1 capitalize">
                  {tooltipInfo.title.toLowerCase()}
                </p>
                {tooltipInfo.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-sm"
                      style={{ background: item.color }}
                    />
                    <span className="text-caption font-normal text-content-primary">
                      {item.label}: {item.value}
                    </span>
                  </div>
                ))}
                {/* Arrow — identical to Tooltip.tsx */}
                <div
                  className={`absolute h-[8px] w-[8px] rotate-45 border border-border-strong bg-surface-primary ${arrowClasses[tooltipInfo.placement]}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
