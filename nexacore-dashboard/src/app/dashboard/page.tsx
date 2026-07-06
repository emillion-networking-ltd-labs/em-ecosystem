"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Divider from "@/components/ui/Divider";
import { usePermissions } from "@/hooks/usePermissions";
import { apiClient, SessionExpiredError } from "@/lib/api";
import type { SafeUser, PaginatedResponse } from "@/lib/types";
import MetricCard from "@/components/ui/MetricCard";
import TotalUsersChart from "@/components/dashboard/TotalUsersChart";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import UserRoleChart from "@/components/dashboard/UserRoleChart";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";

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
            })
            .catch((err) => {
              if (err instanceof SessionExpiredError) return;
            }),
        );
        promises.push(
          apiClient
            .get<PaginatedResponse<SafeUser>>("/users?isActive=true&limit=1")
            .then((res) => {
              results.activeUsers = res.meta.total;
            })
            .catch((err) => {
              if (err instanceof SessionExpiredError) return;
            }),
        );
      }

      if (canReadAuditLogs) {
        promises.push(
          apiClient
            .get<{ total: number }>("/audit-logs?limit=1&page=1")
            .then((res) => {
              results.totalActivity = res.total;
            })
            .catch((err) => {
              if (err instanceof SessionExpiredError) return;
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
      <DashboardLayout>
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <h1 className="text-h2 font-semibold text-content-primary">
            Overview
          </h1>
          <Divider orientation="vertical" className="hidden sm:block" />
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Overview" },
            ]}
          />
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
