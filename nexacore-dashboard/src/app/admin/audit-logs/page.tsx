"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminRoute from "@/components/guards/AdminRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import AuditLogsTable from "@/components/admin/AuditLogsTable";
import AuditLogFilters from "@/components/admin/AuditLogFilters";
import Pagination from "@/components/ui/Pagination";
import { apiClient } from "@/lib/api";
import type { AuditLog, AuditAction, PaginatedResponse } from "@/lib/types";

const LIMIT = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [action, setAction] = useState<AuditAction | "">("");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(LIMIT),
        });
        if (action) params.set("action", action);
        if (userId.trim()) params.set("userId", userId.trim());
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await apiClient.get<PaginatedResponse<AuditLog>>(
          `/audit-logs?${params}`,
        );
        setLogs(res.data);
        setMeta(res.meta);
      } catch {
        // silently fail — user sees empty table
      } finally {
        setLoading(false);
      }
    },
    [action, userId, startDate, endDate],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <AdminRoute>
      <DashboardLayout>
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-h2 font-semibold text-content-primary">
              Audit Logs
            </h1>
            <span className="inline-block h-6 w-px bg-border-strong" />
            <Breadcrumbs
              items={[
                { label: "Dashboards", href: "/dashboard" },
                { label: "Admin", href: "/admin" },
                { label: "Audit Logs" },
              ]}
            />
          </div>
          <p className="mt-1 text-caption text-content-tertiary">
            View security events, login attempts, and administrative actions.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <AuditLogFilters
            action={action}
            onActionChange={setAction}
            userId={userId}
            onUserIdChange={setUserId}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-body text-content-tertiary">
              Loading audit logs...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-border-default bg-surface-primary">
            <p className="text-body text-content-tertiary">
              No audit logs found.
            </p>
          </div>
        ) : (
          <>
            <AuditLogsTable logs={logs} />
            {meta.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={(page) => fetchLogs(page)}
                />
              </div>
            )}
            <p className="mt-2 text-caption text-content-tertiary">
              {meta.total} total entries
            </p>
          </>
        )}
      </DashboardLayout>
    </AdminRoute>
  );
}
