import { Suspense } from 'react';
import AuthLayout from '@/components/layout/AuthLayout';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import GuestRoute from '@/components/guards/GuestRoute';

export const metadata = {
  title: 'Reset Password — EM NexaCore',
};

export default function ResetPasswordPage() {
  return (
    <GuestRoute>
      <AuthLayout>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </AuthLayout>
    </GuestRoute>
  );
}
