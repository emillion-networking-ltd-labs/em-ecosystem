"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import RingSpinner from "@/components/ui/RingSpinner";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user && user.emailVerified === false) {
      router.replace("/activation/check-email");
    }
  }, [isAuthenticated, user, router]);

  // Show spinner only during the initial session check
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <RingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isAuthenticated && user && user.emailVerified === false) {
    return null;
  }

  return <>{children}</>;
}
