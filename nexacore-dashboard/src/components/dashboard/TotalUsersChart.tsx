"use client";

import { useMemo } from "react";
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

const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const thisYearData = [10000, 15000, 12000, 25000, 20000, 28000, 22000];
const lastYearData = [8000, 12000, 11000, 15000, 18000, 20000, 19000];

const formatYAxis = (value: number | string) => {
  const num = Number(value);
  if (num >= 1000) return `${num / 1000}K`;
  return String(num);
};

function getChartColors(isDark: boolean) {
  return {
    line: isDark ? "rgb(245, 245, 245)" : "rgb(28, 28, 28)",
    ticks: isDark ? "rgba(245, 245, 245, 0.5)" : "rgba(28, 28, 28, 0.5)",
    grid: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(28, 28, 28, 0.08)",
    tooltipBg: isDark ? "#1a1a1a" : "#ffffff",
    tooltipText: isDark ? "#f5f5f5" : "#1c1c1c",
    tooltipBorder: isDark
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(28, 28, 28, 0.08)",
  };
}

export default function TotalUsersChart({
  forceDark,
}: { forceDark?: boolean } = {}) {
  const { theme } = useTheme();
  const isDark = forceDark ?? theme === "dark";
  const colors = useMemo(() => getChartColors(isDark), [isDark]);

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
        pointHoverBackgroundColor: colors.line,
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
        pointHoverBackgroundColor: "#a0bce8",
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelColor: (ctx: any) => ({
            borderColor: "transparent",
            backgroundColor: ctx.dataset.borderColor,
            borderWidth: 0,
            borderRadius: 0,
          }),
        },
        bodyFont: { size: 12 },
        titleFont: { size: 12 },
        padding: 10,
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
      <div className="h-[250px]">
        <Line data={data} options={options} />
      </div>
    </ChartCard>
  );
}
