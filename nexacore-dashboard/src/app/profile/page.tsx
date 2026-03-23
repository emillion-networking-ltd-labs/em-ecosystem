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

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <h1 className="mb-6 text-body font-semibold text-content-primary">
          Profile
        </h1>
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
