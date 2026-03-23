"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleX } from "lucide-react";
import AuthLayout from "@/components/layout/AuthLayout";

interface AuthErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

export default function AuthErrorFallback({
  error,
  context = "authentication",
}: AuthErrorFallbackProps) {
  useEffect(() => {
    console.error(`Auth error boundary caught (${context}):`, error);
  }, [error, context]);

  return (
    <AuthLayout narrow>
      <div className="flex flex-col items-center gap-2">
        <CircleX
          size={48}
          className="icon-error text-[#8a1111]"
          strokeWidth={1.5}
        />

        <p className="text-center text-body leading-[21px] text-content-primary/50">
          Something went wrong!
          <br />
          An unexpected error occurred. Please try again.
        </p>

        <Link
          href="/login"
          className="flex h-10 w-full items-center justify-center rounded-md border border-border-strong bg-transparent px-6 py-2.5 text-h3 font-normal text-content-primary transition-colors hover:bg-surface-subtle"
        >
          Go to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
