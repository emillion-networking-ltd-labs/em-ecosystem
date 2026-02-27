'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const isSuccess = status === 'success';

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col justify-center md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Email Verification
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
            {isSuccess
              ? 'Your email address has been verified successfully. You can now access all features of your account.'
              : 'The verification link is invalid or has expired. Please request a new verification email from your profile settings.'}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-4 md:w-[348px]">
        <div className="flex h-16 w-16 items-center justify-center">
          {isSuccess ? (
            <CheckCircle2 size={48} className="text-green-600" />
          ) : (
            <XCircle size={48} className="text-error" />
          )}
        </div>

        <p className="text-center text-sm font-medium text-content-primary">
          {isSuccess ? 'Email verified!' : 'Verification failed'}
        </p>

        <Link
          href={isSuccess ? '/dashboard' : '/login'}
          className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
        >
          {isSuccess ? 'Go to Dashboard' : 'Go to Sign In'}
        </Link>
      </div>
    </div>
  );
}
