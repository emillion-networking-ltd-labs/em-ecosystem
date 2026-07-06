"use client";

import { useEffect, useState } from "react";
import DoughnutChart, {
  type DoughnutDatum,
} from "@/components/ui/DoughnutChart";
import ChartCard from "@/components/ui/ChartCard";
import { apiClient } from "@/lib/api";
import type { SafeUser, PaginatedResponse } from "@/lib/types";

type RoleCounts = {
  USER: number;
  ADMIN: number;
  SUPERADMIN: number;
};

// ECO-150: la presentación del donut la posee el DoughnutChart del DS (una sola presentación, sin drift).
// UserRoleChart es solo el envoltorio CONECTADO: hace el fetch de los conteos por rol y maneja los estados
// de carga/error; en éxito delega en <DoughnutChart>. Color por serie con los tokens de chart dedicados
// (USER/ADMIN = chart-1/chart-2; SUPERADMIN = content-primary, theme-aware) — NO accent (accent es marca,
// no dato).
const ROLE_FILL: Record<string, string> = {
  USER: "var(--color-chart-1)",
  ADMIN: "var(--color-chart-2)",
  SUPERADMIN: "var(--color-content-primary)",
};

export default function UserRoleChart() {
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

  if (loading) {
    return (
      <ChartCard title="Users by Role">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-surface-subtle" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-4 w-24 animate-pulse rounded bg-surface-subtle"
              />
            ))}
          </div>
        </div>
      </ChartCard>
    );
  }

  if (error || !counts) {
    return (
      <ChartCard title="Users by Role">
        <p className="py-4 text-center text-body text-content-tertiary">
          Could not load user data
        </p>
      </ChartCard>
    );
  }

  const roles = ["USER", "ADMIN", "SUPERADMIN"] as const;
  const data: DoughnutDatum[] = roles.map((r) => ({
    name: r,
    value: counts[r],
    fill: ROLE_FILL[r],
  }));

  return <DoughnutChart title="Users by Role" data={data} />;
}
