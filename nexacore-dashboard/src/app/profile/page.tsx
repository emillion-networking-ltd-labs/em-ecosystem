"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import ProfileForm from "@/components/profile/ProfileForm";
import ChangeEmailForm from "@/components/profile/ChangeEmailForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";
import AccountInfo from "@/components/profile/AccountInfo";
import MfaSetup from "@/components/profile/MfaSetup";
import PasskeyManager from "@/components/profile/PasskeyManager";
import TrustedDevices from "@/components/profile/TrustedDevices";
import ConnectedAccounts from "@/components/profile/ConnectedAccounts";
import ActiveSessions from "@/components/profile/ActiveSessions";
import DeleteAccount from "@/components/profile/DeleteAccount";
import SecurityActivity from "@/components/profile/SecurityActivity";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-h2 font-semibold text-content-primary">
            Profile
          </h1>
          <span className="inline-block h-6 w-px bg-border-strong" />
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Profile" },
            ]}
          />
        </div>
        <div className="max-w-2xl space-y-6">
          <ProfileForm />
          <ChangeEmailForm />
          <ChangePasswordForm />
          <MfaSetup />
          <PasskeyManager />
          <TrustedDevices />
          <AccountInfo />
          <ConnectedAccounts />
          <ActiveSessions />
          <DeleteAccount />
          <SecurityActivity />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
