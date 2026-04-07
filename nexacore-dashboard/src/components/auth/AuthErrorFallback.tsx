"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleX } from "lucide-react";
import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";

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

        <p className="text-center text-body text-content-secondary">
          Something went wrong!
          <br />
          An unexpected error occurred. Please try again.
        </p>

        <Button as={Link} href="/login" variant="outline">
          Go to Sign In
        </Button>
      </div>
    </AuthLayout>
  );
}
