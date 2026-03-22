"use client";

import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import ChartCard from "./ChartCard";
import { apiClient } from "@/lib/api";
import type { SafeUser, PaginatedResponse } from "@/lib/types";

ChartJS.register(ArcElement, Tooltip);

type RoleCounts = {
  USER: number;
  ADMIN: number;
  SUPERADMIN: number;
};

const ROLE_COLORS: Record<string, string> = {
  USER: "#a0bce8",
  ADMIN: "#6be6d3",
  SUPERADMIN: "#1c1c1c",
};

const ROLE_BG_CLASSES: Record<string, string> = {
  USER: "bg-[#a0bce8]",
  ADMIN: "bg-[#6be6d3]",
  SUPERADMIN: "bg-[#1c1c1c]",
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "60%",
  plugins: {
    tooltip: {
      backgroundColor: "#ffffff",
      titleColor: "#1c1c1c",
      bodyColor: "#1c1c1c",
      borderColor: "rgba(28, 28, 28, 0.08)",
      borderWidth: 1,
      cornerRadius: 8,
      bodyFont: { size: 12 },
      titleFont: { size: 12 },
      padding: 10,
      callbacks: {
        label: (ctx: { parsed: number; label: string }) =>
          ` ${ctx.label}: ${ctx.parsed}`,
      },
    },
  },
};

export default function UserRoleChart() {
  const [counts, setCounts] = useState<RoleCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [userRes, adminRes, superadminRes] = await Promise.all([
          apiClient.get<PaginatedResponse<SafeUser>>(
            "/users?role=USER&limit=1",
          ),
          apiClient.get<PaginatedResponse<SafeUser>>(
            "/users?role=ADMIN&limit=1",
          ),
          apiClient.get<PaginatedResponse<SafeUser>>(
            "/users?role=SUPERADMIN&limit=1",
          ),
        ]);
        setCounts({
          USER: userRes.meta.total,
          ADMIN: adminRes.meta.total,
          SUPERADMIN: superadminRes.meta.total,
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  const roles = ["USER", "ADMIN", "SUPERADMIN"] as const;
  const total = counts ? counts.USER + counts.ADMIN + counts.SUPERADMIN : 0;

  const data = counts
    ? {
        labels: roles.map((r) => r),
        datasets: [
          {
            data: roles.map((r) => counts[r]),
            backgroundColor: roles.map((r) => ROLE_COLORS[r]),
            borderWidth: 0,
            spacing: 2,
          },
        ],
      }
    : null;

  return (
    <ChartCard title="Users by Role">
      {loading && (
        <div className="flex items-center gap-6">
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
        <p className="py-4 text-center text-caption text-content-primary/50">
          Could not load user data
        </p>
      )}

      {!loading && !error && data && (
        <div className="flex items-center gap-6">
          <div className="h-[120px] w-[120px] flex-shrink-0">
            <Doughnut data={data} options={options} />
          </div>
          <div className="space-y-3">
            {roles.map((role) => {
              const count = counts![role];
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
              return (
                <div key={role} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${ROLE_BG_CLASSES[role]}`}
                  />
                  <span className="text-caption text-content-primary">
                    {role}
                  </span>
                  <span className="text-caption text-content-primary/50">
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
