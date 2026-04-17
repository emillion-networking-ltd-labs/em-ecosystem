"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminRoute from "@/components/guards/AdminRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Divider from "@/components/ui/Divider";
import AuditLogsTable from "@/components/admin/AuditLogsTable";
import AuditLogFilters from "@/components/admin/AuditLogFilters";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import StickyCard from "@/components/ui/StickyCard";
import { apiClient, SessionExpiredError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { AuditLog, AuditAction, PaginatedResponse } from "@/lib/types";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 rows" },
  { value: "20", label: "20 rows" },
  { value: "50", label: "50 rows" },
  { value: "100", label: "100 rows" },
];

export default function AuditLogsPage() {
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Filters
  const [action, setAction] = useState<AuditAction | "">("");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(
    async (page: number, signal?: AbortSignal) => {
      setIsFetching(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        });
        if (action) params.set("action", action);
        if (userId.trim()) params.set("userId", userId.trim());
        if (startDate && endDate) {
          params.set("startDate", startDate);
          params.set("endDate", endDate);
        }

        const res = await apiClient.get<PaginatedResponse<AuditLog>>(
          `/audit-logs?${params}`,
          { signal },
        );
        if (signal?.aborted) return;
        setLogs(res.data);
        setMeta(res.meta);
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof SessionExpiredError) return;
      } finally {
        if (!signal?.aborted) {
          setIsFetching(false);
          setInitialLoading(false);
        }
      }
    },
    [action, userId, startDate, endDate, pageSize],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    fetchLogs(1, controller.signal);
    return () => controller.abort();
  }, [fetchLogs, isAuthenticated]);

  return (
    <AdminRoute>
      <DashboardLayout>
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <h1 className="text-h2 font-semibold text-content-primary">
            Audit Logs
          </h1>
          <Divider orientation="vertical" className="hidden sm:block" />
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Admin", href: "/admin" },
              { label: "Audit Logs" },
            ]}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <StickyCard position="top">
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
          </StickyCard>
        </div>

        {/* Table */}
        <div className="card-flat">
          {initialLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-body text-content-tertiary">
                No audit logs found.
              </p>
            </div>
          ) : (
            <div
              className={`transition-opacity duration-150 ${isFetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}
            >
              <AuditLogsTable logs={logs} />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-caption text-content-tertiary">
                    Rows per page
                  </span>
                  <Select
                    options={PAGE_SIZE_OPTIONS}
                    value={String(pageSize)}
                    onChange={(v) => setPageSize(Number(v))}
                    size="sm"
                  />
                  <span className="text-caption text-content-tertiary">
                    {meta.total} total entries
                  </span>
                </div>
                {meta.totalPages > 1 && (
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={(page) => fetchLogs(page)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AdminRoute>
  );
}
