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

const colors = ['#a0bce8', '#6be6d3', '#000000', '#7dbbff', '#b899eb', '#71dd8c'];

const data = [
  { month: 'Jan', value: 20000 },
  { month: 'Feb', value: 25000 },
  { month: 'Mar', value: 18000 },
  { month: 'Apr', value: 30000 },
  { month: 'May', value: 22000 },
  { month: 'Jun', value: 28000 },
  { month: 'Jul', value: 15000 },
  { month: 'Aug', value: 32000 },
  { month: 'Sep', value: 26000 },
  { month: 'Oct', value: 20000 },
  { month: 'Nov', value: 24000 },
  { month: 'Dec', value: 29000 },
];

const formatYAxis = (value: number) => {
  if (value >= 1000) return `${value / 1000}K`;
  return String(value);
};

export default function MarketingSeoChart() {
  return (
    <ChartCard title="Marketing & SEO">
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
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
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={entry.month} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
