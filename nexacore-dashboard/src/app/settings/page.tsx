"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { usePermissions } from "@/hooks/usePermissions";
import UserPreferences from "@/components/settings/UserPreferences";
import GlobalSettings from "@/components/settings/GlobalSettings";

export default function SettingsPage() {
  const { hasPermission } = usePermissions();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Page header */}
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-h2 font-semibold text-content-primary">
            Settings
          </h1>
          <span className="inline-block h-6 w-px bg-border-strong" />
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Settings" },
            ]}
          />
        </div>

        {/* Settings sections */}
        <div className="space-y-6">
          <UserPreferences />
          {hasPermission("settings:write") && <GlobalSettings />}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
