"use client";

import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import Link from "next/link";

/**
 * Client wrapper for the check-email page content.
 *
 * SCRUM-401: `<Button as={Link} ...>` passes the Next `Link` component (a
 * function reference) into the polymorphic `as` prop. When this JSX lives
 * directly inside the Server Component page.tsx, the function reference
 * crosses the server→client boundary at render time and React 19 / Next 16
 * surfaces the "Functions cannot be passed directly to Client Components"
 * runtime error.
 *
 * Fix: extract the entire JSX into this client component. page.tsx remains
 * a Server Component so it can keep its `export const metadata` (static
 * route metadata must come from Server Components).
 */
export default function CheckEmailContent() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Title Group — Figma: 330px, vertical, pAlign MIN (top) */}
        <div className="flex w-full flex-col md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-h1 font-semibold text-content-primary">
              Check Your Email
            </h1>
            <p className="text-justify text-body text-content-secondary">
              If an account exists for the email you entered, we&apos;ve sent a
              password reset link. The link expires in 1 hour.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-[348px]">
          {/* Field — Figma: 348x110, VERTICAL, itemSpacing 40 */}
          <div className="flex min-h-[110px] flex-col gap-10">
            <p className="text-justify text-body text-content-secondary">
              Didn&apos;t receive the email? Check your spam folder or try again
              with a different email address.
            </p>

            {/* Back to Sign In — Figma: right-aligned text link */}
            <div className="flex items-center justify-end">
              <Button
                as={Link}
                href="/login"
                variant="link-underline"
                size="md"
              >
                Back to Sign In
              </Button>
            </div>
          </div>

          {/* Try Again — Figma: single full-width primary button */}
          <Button as={Link} href="/forgot-password" variant="primary" size="md">
            Try Again
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
