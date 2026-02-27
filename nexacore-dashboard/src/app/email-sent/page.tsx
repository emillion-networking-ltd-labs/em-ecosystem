import AuthLayout from '@/components/layout/AuthLayout';
import Link from 'next/link';

export const metadata = {
  title: 'Verification Email Sent — EM NexaCore',
};

export default function EmailSentPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col justify-center md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
              Check Your Email
            </h1>
            <p className="text-justify text-sm leading-[21px] text-content-primary/50">
              We&apos;ve sent a verification link to your email address. Click
              the link to activate your account.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-[348px]">
          <p className="text-sm leading-[21px] text-content-primary/50">
            Didn&apos;t receive the email? Check your spam folder or sign in to
            resend the verification link from your profile.
          </p>
          <Link
            href="/login"
            className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
