import { Suspense } from 'react';
import AuthLayout from '@/components/layout/AuthLayout';
import VerifyEmailStatus from '@/components/auth/VerifyEmailStatus';

export const metadata = {
  title: 'Verify Email — EM NexaCore',
};

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense>
        <VerifyEmailStatus />
      </Suspense>
    </AuthLayout>
  );
}
