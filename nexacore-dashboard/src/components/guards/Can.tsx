"use client";

import { type ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

type CanProps = {
  permission?: string;
  allPermissions?: string[];
  anyPermission?: string[];
  children: ReactNode;
  fallback?: ReactNode;
};

export default function Can({
  permission,
  allPermissions,
  anyPermission,
  children,
  fallback = null,
}: CanProps) {
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

  return allowed ? <>{children}</> : <>{fallback}</>;
}
