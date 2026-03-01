import AuthLayout from '@/components/layout/AuthLayout';
import Link from 'next/link';

export const metadata = {
  title: 'Verification Email Sent — EM NexaCore',
};

export default function EmailSentPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col md:w-[330px]">
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

        {/* Form — Figma: 348x110, vertical, gap 8 */}
        <div className="flex w-full flex-col gap-2 md:w-[348px]">
          {/* Field — Figma: 348x110, VERTICAL, itemSpacing 40 */}
          <div className="flex min-h-[110px] flex-col gap-10">
            {/* Back To Login Button — Figma: right-aligned text link */}
            <div className="flex items-center justify-end">
              <Link
                href="/login"
                className="whitespace-nowrap text-sm font-medium leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
