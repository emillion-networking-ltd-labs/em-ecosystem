"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminRoute from "@/components/guards/AdminRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PermissionsMatrix from "@/components/admin/PermissionsMatrix";

export default function PermissionsPage() {
  return (
    <AdminRoute>
      <DashboardLayout>
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Admin", href: "/admin" },
              { label: "Permissions" },
            ]}
          />
        </div>

        <div className="mb-6">
          <h1 className="text-h1 font-semibold text-content-primary">
            Role Permissions
          </h1>
          <p className="mt-1 text-caption text-content-tertiary">
            Manage which permissions are assigned to each role. SUPERADMIN
            always has full access.
          </p>
        </div>

        <PermissionsMatrix />
      </DashboardLayout>
    </AdminRoute>
  );
}
