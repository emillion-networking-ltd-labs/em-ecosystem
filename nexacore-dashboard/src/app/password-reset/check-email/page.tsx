import AuthLayout from '@/components/layout/AuthLayout';
import Link from 'next/link';

export const metadata = {
  title: 'Check Your Email — EM NexaCore',
};

export default function CheckEmailPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Title Group — Figma: 330px, vertical, pAlign MIN (top) */}
        <div className="flex w-full flex-col md:w-[330px]">
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

        <div className="flex w-full flex-col gap-2 md:w-[348px]">
          {/* Field — Figma: 348x110, VERTICAL, itemSpacing 40 */}
          <div className="flex min-h-[110px] flex-col gap-10">
            <p className="text-justify text-sm leading-[21px] text-content-primary/50">
              Didn&apos;t receive the email? Check your spam folder or try again
              with a different email address.
            </p>

            {/* Back to Sign In — Figma: right-aligned text link */}
            <div className="flex items-center justify-end">
              <Link
                href="/login"
                className="whitespace-nowrap text-sm font-medium leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
              >
                Back to Sign In
              </Link>
            </div>
          </div>

          {/* Try Again — Figma: single full-width primary button */}
          <Link
            href="/forgot-password"
            className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
          >
            Try Again
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
