"use client";

import Link from "next/link";
import { Users, ScrollText, Key, User, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import ChartCard from "./ChartCard";

type QuickAction = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  permission?: string;
};

const actions: QuickAction[] = [
  {
    href: "/admin",
    label: "Manage Users",
    description: "View and manage user accounts",
    icon: Users,
    permission: "users:read",
  },
  {
    href: "/admin/audit-logs",
    label: "View Audit Logs",
    description: "Review recent system activity",
    icon: ScrollText,
    permission: "audit-logs:read",
  },
  {
    href: "/admin/permissions",
    label: "Manage Permissions",
    description: "Configure role permissions",
    icon: Key,
    permission: "permissions:read",
  },
  {
    href: "/profile",
    label: "My Profile",
    description: "View and edit your profile",
    icon: User,
  },
  {
    href: "/profile",
    label: "Settings",
    description: "Account settings and preferences",
    icon: Settings,
  },
];

export default function QuickActionsCard() {
  const { hasPermission } = usePermissions();

  const visibleActions = actions.filter(
    (a) => !a.permission || hasPermission(a.permission),
  );

  return (
    <ChartCard title="Quick Actions">
      <div className="space-y-1">
        {visibleActions.map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.04]">
              <action.icon size={16} className="text-content-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-normal text-content-primary">
                {action.label}
              </p>
              <p className="text-caption text-content-tertiary">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </ChartCard>
  );
}
