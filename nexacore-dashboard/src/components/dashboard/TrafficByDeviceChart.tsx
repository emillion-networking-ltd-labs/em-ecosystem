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

const items = [
  { name: "Linux", value: 18000, color: "#a0bce8" },
  { name: "Mac", value: 25000, color: "#6be6d3" },
  { name: "iOS", value: 22000, color: "#000000" },
  { name: "Windows", value: 30000, color: "#7dbbff" },
  { name: "Android", value: 15000, color: "#b899eb" },
  { name: "Other", value: 10000, color: "#71dd8c" },
];

const formatYAxis = (value: number | string) => {
  const num = Number(value);
  if (num >= 1000) return `${num / 1000}K`;
  return String(num);
};

const data = {
  labels: items.map((d) => d.name),
  datasets: [
    {
      data: items.map((d) => d.value),
      backgroundColor: items.map((d) => d.color),
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

export default function TrafficByDeviceChart() {
  return (
    <ChartCard title="Traffic by Device">
      <div className="h-[250px]">
        <Bar data={data} options={options} />
      </div>
    </ChartCard>
  );
}
