'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/ui/Button';

function VerifyEmailChangeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status');
  const isSuccess = status === 'success';

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        {isSuccess ? (
          <>
            <CheckCircle2 size={48} className="text-success" />
            <h1 className="text-heading-md text-content-primary">Email Changed Successfully!</h1>
            <p className="text-body-sm text-content-secondary">
              Your email has been updated. All sessions have been revoked for security.
              Please log in with your new email.
            </p>
            <div className="mt-2 w-full">
              <Button size="lg" onClick={() => router.push('/login')}>
                Go to Login
              </Button>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle size={48} className="text-error" />
            <h1 className="text-heading-md text-content-primary">Verification Failed</h1>
            <p className="text-body-sm text-content-secondary">
              The verification link is invalid or has expired.
              Please request a new email change from your profile.
            </p>
            <div className="mt-2 w-full">
              <Button size="lg" onClick={() => router.push('/login')}>
                Back to Login
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailChangePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-content-primary/50">Loading...</p>
        </div>
      }
    >
      <VerifyEmailChangeContent />
    </Suspense>
  );
}
