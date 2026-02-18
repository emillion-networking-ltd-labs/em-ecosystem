"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Divider } from "@/components/ui/Divider";
import { Spinner } from "@/components/ui/Spinner";

export default function RegisterPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/profile");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) return null;

  return (
    <AuthCard title="Create account" subtitle="to get started with EM Ecosystem">
      <div className="space-y-8">
        <RegisterForm />
        <Divider text="or continue with" />
        <OAuthButtons />
        <p className="text-center text-sm text-content-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-accent font-medium hover:text-accent-light"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
