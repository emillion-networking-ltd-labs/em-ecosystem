"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import IconButton from "@/components/ui/IconButton";
import SidebarNav from "@/components/ui/SidebarNav";
import type { SidebarNavSection } from "@/components/ui/SidebarNav";
import {
  PieChart,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  ScrollText,
  Key,
  Settings,
  Palette,
} from "lucide-react";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  mobileVisible?: boolean;
};

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: PieChart },
  { href: "/profile", label: "Profile", icon: User },
];

const adminItem = {
  href: "/admin",
  label: "Admin",
  icon: Shield,
  permission: "users:read",
  children: [
    {
      href: "/admin/audit-logs",
      label: "Audit Logs",
      icon: ScrollText,
      permission: "audit-logs:read",
    },
    {
      href: "/admin/permissions",
      label: "Permissions",
      icon: Key,
      permission: "permissions:read",
    },
    {
      href: "/admin/design-system",
      label: "Design System",
      icon: Palette,
      permission: "permissions:read",
    },
  ],
};

const accountItems = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings:read",
  },
  { href: "/docs", label: "Documentation", icon: FileText },
];

export default function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
  mobileVisible,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const isMobileMode = mobileVisible !== undefined;
  const widthClass = isMobileMode
    ? "w-[212px]"
    : collapsed
      ? "w-[68px]"
      : "w-[212px]";
  const translateClass = isMobileMode
    ? mobileVisible
      ? "translate-x-0"
      : "-translate-x-full"
    : "";

  const sections: SidebarNavSection[] = [
    {
      label: "Dashboards",
      items: [
        ...mainItems.map((item) => ({
          ...item,
          active:
            pathname === item.href || pathname.startsWith(item.href + "/"),
        })),
        ...(hasPermission(adminItem.permission)
          ? [
              {
                ...adminItem,
                children: adminItem.children
                  .filter((c) => hasPermission(c.permission))
                  .map((c) => ({
                    ...c,
                    active:
                      pathname === c.href || pathname.startsWith(c.href + "/"),
                  })),
              },
            ]
          : []),
      ],
    },
    {
      label: "Account",
      items: accountItems
        .filter(
          (item) =>
            !("permission" in item) ||
            !item.permission ||
            hasPermission(item.permission),
        )
        .map((item) => ({
          ...item,
          active:
            pathname === item.href || pathname.startsWith(item.href + "/"),
        })),
    },
  ];

  const userFooter = user ? (
    <div className="border-t border-border-strong pt-3">
      <div className="flex items-center gap-2 rounded-lg p-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-circle bg-surface-inverse text-caption font-semibold text-content-inverse">
          {(user.firstName?.[0] || user.email[0]).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-body font-normal text-content-primary">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email.split("@")[0]}
            </p>
            <p className="truncate text-caption text-content-tertiary">
              {user.role}
            </p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border-components bg-surface-primary transition-[width,transform] duration-200 ${widthClass} ${translateClass}`}
    >
      <div className="flex items-center justify-between rounded-lg p-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.04]">
            <span className="text-caption font-semibold text-content-primary">
              E
            </span>
          </div>
          {!collapsed && !isMobileMode && (
            <Link
              href="/dashboard"
              className="text-body font-semibold text-content-primary"
            >
              EM NexaCore
            </Link>
          )}
          {isMobileMode && (
            <span className="text-body font-semibold text-content-primary">
              EM NexaCore
            </span>
          )}
        </div>
        {isMobileMode ? (
          <IconButton size="sm" onClick={onToggle} aria-label="Close sidebar">
            <X size={16} />
          </IconButton>
        ) : (
          <IconButton
            size="sm"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </IconButton>
        )}
      </div>

      <SidebarNav
        sections={sections}
        collapsed={collapsed && !isMobileMode}
        onNavigate={onNavigate ? (_href, _e) => onNavigate() : undefined}
        footer={userFooter}
      />
    </aside>
  );
}
