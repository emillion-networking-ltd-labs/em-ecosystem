import AuthLayout from '@/components/layout/AuthLayout';
import Link from 'next/link';

export const metadata = {
  title: 'Check Your Email — EM NexaCore',
};

export default function CheckEmailPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col justify-center md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
              Check Your Email
            </h1>
            <p className="text-justify text-sm leading-[21px] text-content-primary/50">
              If an account exists for the email you entered, we&apos;ve sent a
              password reset link. The link expires in 1 hour.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-[348px]">
          <p className="text-sm leading-[21px] text-content-primary/50">
            Didn&apos;t receive the email? Check your spam folder or try again
            with a different email address.
          </p>
          <div className="flex gap-2">
            <Link
              href="/forgot-password"
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Try Again
            </Link>
            <Link
              href="/login"
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
