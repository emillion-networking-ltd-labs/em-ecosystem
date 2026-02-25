'use client';

import { ChevronDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import MetricCard from '@/components/dashboard/MetricCard';
import TotalUsersChart from '@/components/dashboard/TotalUsersChart';
import TrafficByWebsiteChart from '@/components/dashboard/TrafficByWebsiteChart';
import TrafficByDeviceChart from '@/components/dashboard/TrafficByDeviceChart';
import TrafficByLocationChart from '@/components/dashboard/TrafficByLocationChart';
import MarketingSeoChart from '@/components/dashboard/MarketingSeoChart';
import RightPanel from '@/components/dashboard/RightPanel';

const metrics = [
  { label: 'Views', value: '7,265', trend: 11.01, colorVariant: 'purple' as const },
  { label: 'Visits', value: '3,671', trend: -0.03, colorVariant: 'blue' as const },
  { label: 'New Users', value: '156', trend: 15.03, colorVariant: 'purple' as const },
  { label: 'Active Users', value: '2,318', trend: 6.08, colorVariant: 'blue' as const },
];

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout rightPanel={<RightPanel />}>
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="rounded-xl bg-transparent px-2 py-1 text-body-sm font-semibold text-content-primary">
            Overview
          </h1>
          <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-caption text-content-primary hover:bg-surface-subtle">
            Today
            <ChevronDown size={16} className="text-content-tertiary" />
          </button>
        </div>

        {/* Metric cards */}
        <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {/* Charts row 1: Total Users + Traffic by Website */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_202px]">
          <TotalUsersChart />
          <TrafficByWebsiteChart />
        </div>

        {/* Charts row 2: Traffic by Device + Traffic by Location */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <TrafficByDeviceChart />
          <TrafficByLocationChart />
        </div>

        {/* Full width chart: Marketing & SEO */}
        <MarketingSeoChart />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
