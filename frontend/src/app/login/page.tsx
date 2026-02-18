"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Divider } from "@/components/ui/Divider";
import { Spinner } from "@/components/ui/Spinner";

function LoginPageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && user) {
      const redirect = searchParams.get("redirect") || "/profile";
      router.replace(redirect);
    }
  }, [user, isLoading, router, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) return null;

  return (
    <AuthCard title="Sign in" subtitle="to continue to EM Ecosystem">
      <div className="space-y-8">
        <LoginForm />
        <Divider text="or continue with" />
        <OAuthButtons />
        <p className="text-center text-sm text-content-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-accent font-medium hover:text-accent-light"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
