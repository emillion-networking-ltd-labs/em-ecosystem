'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ChartCard from './ChartCard';

const data = [
  { name: 'United States', value: 52.1, color: '#a0bce8' },
  { name: 'Canada', value: 22.8, color: '#6be6d3' },
  { name: 'Mexico', value: 13.9, color: '#000000' },
  { name: 'Other', value: 11.2, color: '#b899eb' },
];

export default function TrafficByLocationChart() {
  return (
    <ChartCard title="Traffic by Location">
      <div className="flex items-center gap-6">
        <div className="h-[120px] w-[120px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-primary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-caption text-content-primary">{item.name}</span>
              <span className="text-caption text-content-tertiary">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
