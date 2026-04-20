"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";
import { apiClient } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";
import type { SafeUser, PaginatedResponse } from "@/lib/types";

type RoleCounts = {
  USER: number;
  ADMIN: number;
  SUPERADMIN: number;
};

function getRoleColors(isDark: boolean) {
  return {
    USER: "#a0bce8",
    ADMIN: "#6be6d3",
    SUPERADMIN: isDark ? "#f5f5f5" : "#1c1c1c",
  } as Record<string, string>;
}

function getRoleBgClasses(isDark: boolean) {
  return {
    USER: "bg-[#a0bce8]",
    ADMIN: "bg-[#6be6d3]",
    SUPERADMIN: isDark ? "bg-[#f5f5f5]" : "bg-[#1c1c1c]",
  } as Record<string, string>;
}

export default function UserRoleChart() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [counts, setCounts] = useState<RoleCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchCounts() {
      try {
        const opts = { signal: controller.signal };
        const [userRes, adminRes, superadminRes] = await Promise.all([
          apiClient.get<PaginatedResponse<SafeUser>>(
            "/users?role=USER&limit=1",
            opts,
          ),
          apiClient.get<PaginatedResponse<SafeUser>>(
            "/users?role=ADMIN&limit=1",
            opts,
          ),
          apiClient.get<PaginatedResponse<SafeUser>>(
            "/users?role=SUPERADMIN&limit=1",
            opts,
          ),
        ]);
        if (controller.signal.aborted) return;
        setCounts({
          USER: userRes.meta.total,
          ADMIN: adminRes.meta.total,
          SUPERADMIN: superadminRes.meta.total,
        });
      } catch {
        if (controller.signal.aborted) return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchCounts();
    return () => controller.abort();
  }, []);

  const roles = ["USER", "ADMIN", "SUPERADMIN"] as const;
  const total = counts ? counts.USER + counts.ADMIN + counts.SUPERADMIN : 0;
  const roleColors = getRoleColors(isDark);
  const roleBgClasses = getRoleBgClasses(isDark);

  const pieData = counts
    ? roles.map((r) => ({ name: r, value: counts[r], fill: roleColors[r] }))
    : [];

  return (
    <ChartCard title="Users by Role">
      {loading && (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-black/[0.08] dark:bg-white/[0.08]" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-4 w-24 animate-pulse rounded bg-black/[0.08] dark:bg-white/[0.08]"
              />
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="py-4 text-center text-body text-content-tertiary">
          Could not load user data
        </p>
      )}

      {!loading && !error && pieData.length > 0 && (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="h-[120px] w-[120px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    return (
                      <div className="rounded-lg border border-border-strong bg-surface-primary px-4 py-3 shadow-card whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-sm"
                            style={{
                              background: item.payload?.fill || item.color,
                            }}
                          />
                          <span className="text-caption font-normal text-content-primary">
                            {item.name}: {item.value}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {roles.map((role) => {
              const count = counts![role];
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
              return (
                <div key={role} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${roleBgClasses[role]}`}
                  />
                  <span className="text-caption text-content-primary">
                    {role}
                  </span>
                  <span className="text-caption text-content-tertiary">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
