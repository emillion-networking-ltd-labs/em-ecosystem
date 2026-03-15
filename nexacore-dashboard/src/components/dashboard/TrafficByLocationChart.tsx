"use client";

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import ChartCard from "./ChartCard";

ChartJS.register(ArcElement, Tooltip);

const items = [
  { name: "United States", value: 52.1, color: "#a0bce8" },
  { name: "Canada", value: 22.8, color: "#6be6d3" },
  { name: "Mexico", value: 13.9, color: "#000000" },
  { name: "Other", value: 11.2, color: "#b899eb" },
];

const colorClassMap: Record<string, string> = {
  "#a0bce8": "bg-[#a0bce8]",
  "#6be6d3": "bg-[#6be6d3]",
  "#000000": "bg-[#000000]",
  "#b899eb": "bg-[#b899eb]",
};

const data = {
  labels: items.map((d) => d.name),
  datasets: [
    {
      data: items.map((d) => d.value),
      backgroundColor: items.map((d) => d.color),
      borderWidth: 0,
      spacing: 2,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "60%",
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
      callbacks: {
        label: (ctx: { parsed: number }) => ` ${ctx.parsed}%`,
      },
    },
  },
};

export default function TrafficByLocationChart() {
  return (
    <ChartCard title="Traffic by Location">
      <div className="flex items-center gap-6">
        <div className="h-[120px] w-[120px] flex-shrink-0">
          <Doughnut data={data} options={options} />
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${colorClassMap[item.color]}`}
              />
              <span className="text-caption text-content-primary">
                {item.name}
              </span>
              <span className="text-caption text-content-tertiary">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
