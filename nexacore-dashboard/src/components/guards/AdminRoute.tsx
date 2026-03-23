"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";

function AdminCheck({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  useEffect(() => {
    if (isInitialized && user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isInitialized, user, isAdmin, router]);

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AdminCheck>{children}</AdminCheck>
    </ProtectedRoute>
  );
}
