'use client';

import ChartCard from './ChartCard';

const websites = [
  { name: 'Google', value: 80 },
  { name: 'YouTube', value: 65 },
  { name: 'Instagram', value: 50 },
  { name: 'Pinterest', value: 40 },
  { name: 'Facebook', value: 35 },
  { name: 'Twitter', value: 25 },
];

export default function TrafficByWebsiteChart() {
  const maxValue = Math.max(...websites.map((w) => w.value));

  return (
    <ChartCard title="Traffic by Website">
      <div className="space-y-3">
        {websites.map((site) => (
          <div key={site.name}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-caption text-content-primary">{site.name}</span>
              <span className="text-caption text-content-tertiary">{site.value}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
              <div
                className="h-full rounded-full bg-content-primary/80 transition-all"
                style={{ width: `${(site.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
