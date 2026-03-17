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
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Settings" },
            ]}
          />
        </div>

        {/* Page header */}
        <h1 className="mb-6 text-heading-lg font-semibold text-content-primary">
          Settings
        </h1>

        {/* Settings sections */}
        <div className="space-y-6">
          <UserPreferences />
          {hasPermission("settings:write") && <GlobalSettings />}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
