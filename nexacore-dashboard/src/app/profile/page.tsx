'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import ProfileForm from '@/components/profile/ProfileForm';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import AccountInfo from '@/components/profile/AccountInfo';
import MfaSetup from '@/components/profile/MfaSetup';
import PasskeyManager from '@/components/profile/PasskeyManager';
import ConnectedAccounts from '@/components/profile/ConnectedAccounts';
import ActiveSessions from '@/components/profile/ActiveSessions';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <h1 className="mb-6 text-body-sm font-semibold text-content-primary">Profile</h1>
        <div className="max-w-2xl space-y-6">
          <ProfileForm />
          <ChangePasswordForm />
          <MfaSetup />
          <PasskeyManager />
          <AccountInfo />
          <ConnectedAccounts />
          <ActiveSessions />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
