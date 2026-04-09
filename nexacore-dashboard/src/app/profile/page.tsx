"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import ProfileForm from "@/components/profile/ProfileForm";
import SecurityPanel from "@/components/profile/SecurityPanel";
import DevicesPanel from "@/components/profile/DevicesPanel";
import ConnectedAccounts from "@/components/profile/ConnectedAccounts";
import ActiveSessions from "@/components/profile/ActiveSessions";
import DeleteAccount from "@/components/profile/DeleteAccount";
import SecurityActivity from "@/components/profile/SecurityActivity";
import Accordion from "@/components/ui/Accordion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Divider from "@/components/ui/Divider";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-h2 font-semibold text-content-primary">
            Profile
          </h1>
          <Divider orientation="vertical" className="h-6" />
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Profile" },
            ]}
          />
        </div>
        <ProfileForm />
        <div className="mt-6">
          <ConnectedAccounts />
        </div>
        <div className="mt-6 card-flat">
          <Accordion
            variant="section"
            items={[
              {
                title: "Security",
                children: <SecurityPanel />,
              },
              { title: "Devices", children: <DevicesPanel /> },
              { title: "Active Sessions", children: <ActiveSessions /> },
              { title: "Security Activity", children: <SecurityActivity /> },
            ]}
          />
        </div>
        <div className="mt-6">
          <DeleteAccount />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
