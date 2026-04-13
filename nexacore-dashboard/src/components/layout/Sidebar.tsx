"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import IconButton from "@/components/ui/IconButton";
import SidebarNav from "@/components/ui/SidebarNav";
import type { SidebarNavSection } from "@/components/ui/SidebarNav";
import {
  PieChart,
  User,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
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
  const { hasPermission } = usePermissions();
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY === 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isMobileMode = mobileVisible !== undefined;
  const widthClass = isMobileMode
    ? "w-[300px]"
    : collapsed
      ? "w-[68px]"
      : "w-[300px]";
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

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col rounded-r-xl border-r border-border-strong bg-surface-primary shadow-card transition-[width,transform] duration-200 ${widthClass} ${translateClass}`}
    >
      {/* Header area — h-[68px] aligned with NavBar */}
      <div
        className={`flex h-[68px] shrink-0 items-center justify-between px-4 ${atTop ? "border-b border-dashed border-border-strong" : ""}`}
      >
        {!collapsed && (
          <Link href="/dashboard">
            <Image
              src="/em-icon.png"
              alt="EM NexaCore"
              width={60}
              height={24}
              className="shrink-0 dark:invert"
            />
          </Link>
        )}
        <IconButton
          variant="boxed"
          size="sm"
          onClick={onToggle}
          className={collapsed && !isMobileMode ? "mx-auto" : ""}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed && !isMobileMode ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav
          sections={sections}
          collapsed={collapsed && !isMobileMode}
          onNavigate={onNavigate ? (_href, _e) => onNavigate() : undefined}
        />
      </div>
    </aside>
  );
}
