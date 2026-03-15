"use client";

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

const data = {
  labels,
  datasets: [
    {
      label: "This year",
      data: thisYearData,
      borderColor: "rgb(28, 28, 28)",
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
    },
    {
      label: "Last year",
      data: lastYearData,
      borderColor: "#a0bce8",
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      tension: 0.4,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { size: 12 }, color: "rgba(28, 28, 28, 0.4)" },
    },
    y: {
      grid: { color: "rgba(28, 28, 28, 0.08)", drawTicks: false },
      border: { display: false, dash: [3, 3] },
      ticks: {
        font: { size: 12 },
        color: "rgba(28, 28, 28, 0.4)",
        callback: formatYAxis,
        padding: 8,
      },
    },
  },
  plugins: {
    tooltip: {
      backgroundColor: "#ffffff",
      titleColor: "#1c1c1c",
      bodyColor: "#1c1c1c",
      borderColor: "rgba(28, 28, 28, 0.08)",
      borderWidth: 1,
      cornerRadius: 8,
      bodyFont: { size: 12 },
      titleFont: { size: 12 },
      padding: 10,
    },
  },
};

export default function TotalUsersChart() {
  return (
    <ChartCard
      title="Total Users"
      action={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-content-primary" />
            <span className="text-caption text-content-tertiary">
              This year
            </span>
          </div>
          <span className="text-body-sm text-content-primary/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#a0bce8]" />
            <span className="text-caption text-content-tertiary">
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
