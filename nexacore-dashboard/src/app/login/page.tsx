import { Suspense } from 'react';
import AuthLayout from '@/components/layout/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import GuestRoute from '@/components/guards/GuestRoute';

export const metadata = {
  title: 'Sign In — EM NexaCore',
};

export default function LoginPage() {
  return (
    <GuestRoute>
      <AuthLayout>
        <Suspense>
          <LoginForm />
        </Suspense>
      </AuthLayout>
    </GuestRoute>
  );
}
