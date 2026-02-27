'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { LucideIcon } from 'lucide-react';
import {
  PieChart,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  FileText,
  ScrollText,
  Key,
} from 'lucide-react';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

const mainItems = [
  { href: '/dashboard', label: 'Dashboard', icon: PieChart },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminItems = [
  { href: '/admin', label: 'Admin', icon: Shield },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/admin/permissions', label: 'Permissions', icon: Key },
];

const accountItems = [
  { href: '/docs', label: 'Documentation', icon: FileText, external: true },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border-default bg-surface-primary transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[212px]'
      }`}
    >
      {/* Logo area */}
      <div className="flex h-[68px] items-center justify-between px-4">
        {!collapsed && (
          <span className="text-body-sm font-semibold text-content-primary">NexaCore</span>
        )}
        <button
          onClick={onToggle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl p-1 text-content-secondary hover:bg-surface-subtle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation sections */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
        {/* MAIN section */}
        <NavSection label={collapsed ? '' : 'MAIN'}>
          {mainItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(item.href + '/')}
              collapsed={collapsed}
            />
          ))}
          {isAdmin &&
            adminItems.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={pathname === item.href || pathname.startsWith(item.href + '/')}
                collapsed={collapsed}
              />
            ))}
        </NavSection>

        {/* ACCOUNT section */}
        <NavSection label={collapsed ? '' : 'ACCOUNT'} className="mt-6">
          {accountItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={false}
              collapsed={collapsed}
            />
          ))}
        </NavSection>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User card at bottom */}
        {user && (
          <div className="border-t border-border-default pt-3">
            <div className="flex items-center gap-2 rounded-lg p-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-circle bg-surface-inverse text-[10px] font-semibold text-content-inverse">
                {(user.firstName?.[0] || user.email[0]).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium text-content-primary">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email.split('@')[0]}
                  </p>
                  <p className="truncate text-caption text-content-tertiary">{user.role}</p>
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
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <p className="mb-2 px-2 text-caption font-semibold uppercase tracking-wider text-content-tertiary">
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
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1 p-2 text-body-sm transition-colors ${
        active
          ? 'rounded-3xl bg-surface-subtle text-content-primary'
          : 'rounded-xl text-content-primary hover:bg-surface-subtle'
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} className="shrink-0" />
      {!collapsed && <span className="ml-1">{label}</span>}
    </Link>
  );
}
