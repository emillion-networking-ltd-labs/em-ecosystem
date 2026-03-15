"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartCard from "./ChartCard";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const colors = [
  "#a0bce8",
  "#6be6d3",
  "#000000",
  "#7dbbff",
  "#b899eb",
  "#71dd8c",
];

const labels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const values = [
  20000, 25000, 18000, 30000, 22000, 28000, 15000, 32000, 26000, 20000, 24000,
  29000,
];

const formatYAxis = (value: number | string) => {
  const num = Number(value);
  if (num >= 1000) return `${num / 1000}K`;
  return String(num);
};

const data = {
  labels,
  datasets: [
    {
      data: values,
      backgroundColor: labels.map((_, i) => colors[i % colors.length]),
      borderRadius: 4,
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
      border: { display: false },
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

export default function MarketingSeoChart() {
  return (
    <ChartCard title="Marketing & SEO">
      <div className="h-[250px]">
        <Bar data={data} options={options} />
      </div>
    </ChartCard>
  );
}
