"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

type PermissionRouteProps = {
  permission?: string;
  allPermissions?: string[];
  anyPermission?: string[];
  children: ReactNode;
  redirectTo?: string;
};

export default function PermissionRoute({
  permission,
  allPermissions,
  anyPermission,
  children,
  redirectTo = "/dashboard",
}: PermissionRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const { hasPermission, hasAllPermissions, hasAnyPermission } =
    usePermissions();

  let allowed = false;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (allPermissions) {
    allowed = hasAllPermissions(allPermissions);
  } else if (anyPermission) {
    allowed = hasAnyPermission(anyPermission);
  } else {
    allowed = true;
  }

  useEffect(() => {
    if (isInitialized && (!isAuthenticated || !allowed)) {
      router.replace(redirectTo);
    }
  }, [isInitialized, isAuthenticated, allowed, router, redirectTo]);

  if (!isInitialized || !isAuthenticated || !allowed) {
    return null;
  }

  return <>{children}</>;
}
