'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import ChartCard from './ChartCard';

const data = [
  { month: 'Jan', thisYear: 10000, lastYear: 8000 },
  { month: 'Feb', thisYear: 15000, lastYear: 12000 },
  { month: 'Mar', thisYear: 12000, lastYear: 11000 },
  { month: 'Apr', thisYear: 25000, lastYear: 15000 },
  { month: 'May', thisYear: 20000, lastYear: 18000 },
  { month: 'Jun', thisYear: 28000, lastYear: 20000 },
  { month: 'Jul', thisYear: 22000, lastYear: 19000 },
];

const formatYAxis = (value: number) => {
  if (value >= 1000) return `${value / 1000}K`;
  return String(value);
};

export default function TotalUsersChart() {
  return (
    <ChartCard
      title="Total Users"
      action={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-content-primary" />
            <span className="text-caption text-content-tertiary">This year</span>
          </div>
          <span className="text-body-sm text-content-primary/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#a0bce8]" />
            <span className="text-caption text-content-tertiary">Last year</span>
          </div>
        </div>
      }
    >
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: 'var(--content-tertiary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12, fill: 'var(--content-tertiary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="thisYear"
              stroke="rgb(var(--content-primary))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="lastYear"
              stroke="#a0bce8"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
