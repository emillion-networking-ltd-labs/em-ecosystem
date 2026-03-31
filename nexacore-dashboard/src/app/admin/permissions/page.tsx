"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminRoute from "@/components/guards/AdminRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Divider from "@/components/ui/Divider";
import PermissionsMatrix from "@/components/admin/PermissionsMatrix";

export default function PermissionsPage() {
  return (
    <AdminRoute>
      <DashboardLayout>
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-h2 font-semibold text-content-primary">
            Role Permissions
          </h1>
          <Divider orientation="vertical" className="h-6" />
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Admin", href: "/admin" },
              { label: "Permissions" },
            ]}
          />
        </div>

        <PermissionsMatrix />
      </DashboardLayout>
    </AdminRoute>
  );
}
