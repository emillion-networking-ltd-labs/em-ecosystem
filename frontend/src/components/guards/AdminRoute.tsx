"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/profile");
    }
  }, [user, isLoading, router]);

  return (
    <ProtectedRoute>
      {user?.role === "ADMIN" ? children : null}
    </ProtectedRoute>
  );
}
