'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import {
  PanelLeft,
  Star,
  Search,
  Bell,
  PanelRight,
  User,
  Shield,
  LogOut,
  ChevronDown,
} from 'lucide-react';

type NavBarProps = {
  onMenuClick: () => void;
  onRightPanelToggle?: () => void;
};

const routeLabels: Record<string, string> = {
  '/dashboard': 'Overview',
  '/profile': 'Profile',
  '/admin': 'User Management',
};

export default function NavBar({ onMenuClick, onRightPanelToggle }: NavBarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  // Build breadcrumbs from pathname
  const parentLabel = pathname.startsWith('/admin') ? 'Admin' : 'Dashboards';
  const currentLabel = routeLabels[pathname] || pathname.split('/').pop() || '';
  const breadcrumbItems = [
    { label: parentLabel, href: pathname.startsWith('/admin') ? '/admin' : '/dashboard' },
    { label: currentLabel },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border-default bg-surface-primary px-7">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-content-secondary hover:bg-surface-subtle lg:hidden"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={20} />
        </button>

        {/* Desktop: sidebar toggle + star + breadcrumbs */}
        <div className="hidden items-center gap-2 lg:flex">
          <button
            onClick={onMenuClick}
            className="flex h-6 w-6 items-center justify-center rounded-xl p-1 text-content-secondary hover:text-content-primary"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={16} />
          </button>
          <button
            className="flex h-6 w-6 items-center justify-center rounded-xl p-1 text-content-secondary hover:text-content-primary"
            aria-label="Bookmark"
          >
            <Star size={16} />
          </button>
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Compact search bar (desktop only) */}
        <div className="hidden items-center gap-2 rounded-2xl bg-surface-subtle px-2 py-1 lg:flex">
          <Search size={16} className="text-content-tertiary" />
          <span className="text-caption text-content-tertiary">Search</span>
          <kbd className="rounded-xs border border-border-default px-1 text-caption text-content-tertiary">
            /
          </kbd>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="flex h-6 w-6 items-center justify-center rounded-xl p-1 text-content-primary hover:bg-surface-subtle"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>
          {onRightPanelToggle && (
            <button
              onClick={onRightPanelToggle}
              className="hidden h-6 w-6 items-center justify-center rounded-xl p-1 text-content-primary hover:bg-surface-subtle lg:flex"
              aria-label="Toggle right panel"
            >
              <PanelRight size={16} />
            </button>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm text-content-primary hover:bg-surface-subtle"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-circle bg-surface-inverse text-caption font-semibold text-content-inverse">
              {(user?.firstName?.[0] || user?.email[0] || '?').toUpperCase()}
            </div>
            <ChevronDown size={14} className="text-content-tertiary" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-3xl border border-border-default bg-surface-primary p-6 shadow-card">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 rounded-3xl p-2 text-caption text-content-primary hover:bg-surface-subtle"
              >
                <User size={16} />
                Profile
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-3xl p-2 text-caption text-content-primary hover:bg-surface-subtle"
                >
                  <Shield size={16} />
                  Admin
                </Link>
              )}
              <div className="my-2 h-px bg-border-default" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-3xl p-2 text-caption text-error hover:bg-surface-subtle"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
