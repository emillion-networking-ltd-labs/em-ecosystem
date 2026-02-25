'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import ChartCard from './ChartCard';

const data = [
  { name: 'Linux', value: 18000, color: '#a0bce8' },
  { name: 'Mac', value: 25000, color: '#6be6d3' },
  { name: 'iOS', value: 22000, color: '#000000' },
  { name: 'Windows', value: 30000, color: '#7dbbff' },
  { name: 'Android', value: 15000, color: '#b899eb' },
  { name: 'Other', value: 10000, color: '#71dd8c' },
];

const formatYAxis = (value: number) => {
  if (value >= 1000) return `${value / 1000}K`;
  return String(value);
};

export default function TrafficByDeviceChart() {
  return (
    <ChartCard title="Traffic by Device">
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
            <XAxis
              dataKey="name"
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
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
