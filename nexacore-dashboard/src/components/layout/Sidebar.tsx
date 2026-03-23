"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import type { LucideIcon } from "lucide-react";
import {
  PieChart,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
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
  /** Mobile-only: controls slide-in visibility */
  mobileVisible?: boolean;
};

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: PieChart },
  { href: "/profile", label: "Profile", icon: User },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: Shield, permission: "users:read" },
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
];

const accountItems = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings:read",
  },
  { href: "/docs", label: "Documentation", icon: FileText, external: true },
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

  // When mobileVisible is defined, sidebar is in mobile mode: always 212px, slide via transform
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

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border-strong bg-surface-primary transition-[width,transform] duration-200 ${widthClass} ${translateClass}`}
    >
      {/* Logo area */}
      <div className="flex items-center justify-between rounded-lg p-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.04]">
            <span className="text-caption font-semibold text-content-primary">
              N
            </span>
          </div>
          {!collapsed && (
            <span className="text-body leading-[20px] font-normal text-content-primary">
              NexaCore
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl p-1 text-content-secondary hover:text-content-primary"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation sections */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
        {/* MAIN section */}
        <NavSection label={collapsed ? "" : "Dashboards"}>
          {mainItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={
                pathname === item.href || pathname.startsWith(item.href + "/")
              }
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
          {adminItems
            .filter(
              (item) => !item.permission || hasPermission(item.permission),
            )
            .map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={
                  pathname === item.href || pathname.startsWith(item.href + "/")
                }
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
        </NavSection>

        {/* ACCOUNT section */}
        <NavSection label={collapsed ? "" : "Account"} className="mt-2">
          {accountItems
            .filter(
              (item) =>
                !("permission" in item) ||
                !item.permission ||
                hasPermission(item.permission),
            )
            .map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={
                  pathname === item.href || pathname.startsWith(item.href + "/")
                }
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
        </NavSection>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User card at bottom */}
        {user && (
          <div className="border-t border-border-default pt-3">
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
        )}
      </nav>
    </aside>
  );
}

/* ---- Sub-components ---- */

function NavSection({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <p className="mb-2 px-3 text-body leading-[20px] font-normal text-content-primary/40">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  external?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex h-9 items-center gap-1 rounded-xl p-2 text-body leading-[20px] transition-colors ${
        active
          ? "bg-black/[0.04] text-content-primary dark:bg-white/[0.04]"
          : "text-content-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
