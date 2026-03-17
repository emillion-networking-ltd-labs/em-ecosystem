"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { usePermissions } from "@/hooks/usePermissions";
import { apiClient } from "@/lib/api";
import type { SafeUser, PaginatedResponse } from "@/lib/types";
import MetricCard from "@/components/dashboard/MetricCard";
import TotalUsersChart from "@/components/dashboard/TotalUsersChart";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import UserRoleChart from "@/components/dashboard/UserRoleChart";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import RightPanel from "@/components/dashboard/RightPanel";

type DashboardMetrics = {
  totalUsers: number | null;
  activeUsers: number | null;
  totalActivity: number | null;
};

export default function DashboardPage() {
  const { hasPermission } = usePermissions();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: null,
    activeUsers: null,
    totalActivity: null,
  });
  const [loading, setLoading] = useState(true);

  const canReadUsers = hasPermission("users:read");
  const canReadAuditLogs = hasPermission("audit-logs:read");

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    const results: DashboardMetrics = {
      totalUsers: null,
      activeUsers: null,
      totalActivity: null,
    };

    try {
      const promises: Promise<void>[] = [];

      if (canReadUsers) {
        promises.push(
          apiClient
            .get<PaginatedResponse<SafeUser>>("/users?limit=1")
            .then((res) => {
              results.totalUsers = res.meta.total;
            }),
        );
        promises.push(
          apiClient
            .get<PaginatedResponse<SafeUser>>("/users?isActive=true&limit=1")
            .then((res) => {
              results.activeUsers = res.meta.total;
            }),
        );
      }

      if (canReadAuditLogs) {
        promises.push(
          apiClient
            .get<{ total: number }>("/audit-logs?limit=1&page=1")
            .then((res) => {
              results.totalActivity = res.total;
            }),
        );
      }

      await Promise.allSettled(promises);
    } catch {
      // Individual failures handled by allSettled
    } finally {
      setMetrics(results);
      setLoading(false);
    }
  }, [canReadUsers, canReadAuditLogs]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

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
          {canReadUsers && (
            <MetricCard
              label="Total Users"
              value={metrics.totalUsers?.toLocaleString() ?? "—"}
              colorVariant="purple"
              loading={loading}
            />
          )}
          {canReadUsers && (
            <MetricCard
              label="Active Users"
              value={metrics.activeUsers?.toLocaleString() ?? "—"}
              colorVariant="blue"
              loading={loading}
            />
          )}
          {canReadAuditLogs && (
            <MetricCard
              label="Audit Events"
              value={metrics.totalActivity?.toLocaleString() ?? "—"}
              colorVariant="purple"
              loading={loading}
            />
          )}
          <MetricCard
            label="System Status"
            value="Operational"
            colorVariant="blue"
          />
        </div>

        {/* Row 2: Charts + Activity */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {canReadUsers && <TotalUsersChart />}
          {canReadAuditLogs && <RecentActivityFeed />}
        </div>

        {/* Row 3: Role distribution + Quick actions */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {canReadUsers && <UserRoleChart />}
          <QuickActionsCard />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
