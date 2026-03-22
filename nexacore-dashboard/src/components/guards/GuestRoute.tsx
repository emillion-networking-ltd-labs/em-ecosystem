"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import RingSpinner from "@/components/ui/RingSpinner";

export default function GuestRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isInitialized, isAuthenticated, router]);

  // Show spinner only during the initial session check
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <RingSpinner size="lg" />
      </div>
    );
  }

  // Already authenticated — redirect is pending via useEffect
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
