"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Avatar from "@/components/ui/Avatar";
import Divider from "@/components/ui/Divider";
import IconButton from "@/components/ui/IconButton";
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
} from "lucide-react";

type NavBarProps = {
  onMenuClick: () => void;
  onRightPanelToggle?: () => void;
};

const routeLabels: Record<string, string> = {
  "/dashboard": "Overview",
  "/profile": "Profile",
  "/admin": "User Management",
};

export default function NavBar({
  onMenuClick,
  onRightPanelToggle,
}: NavBarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { hasPermission } = usePermissions();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  // Build breadcrumbs from pathname
  const parentLabel = pathname.startsWith("/admin") ? "Admin" : "Dashboards";
  const currentLabel = routeLabels[pathname] || pathname.split("/").pop() || "";
  const breadcrumbItems = [
    {
      label: parentLabel,
      href: pathname.startsWith("/admin") ? "/admin" : "/dashboard",
    },
    { label: currentLabel },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border-strong bg-surface-primary px-7">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <IconButton
          variant="boxed"
          size="md"
          onClick={onMenuClick}
          className="lg:hidden"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </IconButton>

        {/* Desktop: sidebar toggle + star + breadcrumbs */}
        <div className="hidden items-center gap-2 lg:flex">
          <IconButton
            variant="boxed"
            size="sm"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={16} />
          </IconButton>
          <IconButton variant="boxed" size="sm" aria-label="Bookmark">
            <Star size={16} />
          </IconButton>
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Compact search bar (desktop only) */}
        <div className="hidden w-[160px] items-center gap-2 rounded-2xl bg-surface-subtle px-2 py-1 lg:flex">
          <Search size={16} className="text-content-primary/50" />
          <span className="text-body leading-[20px] text-content-primary/50">
            Search
          </span>
          <kbd className="rounded-xs border border-border-strong px-1 text-caption text-content-primary/50">
            /
          </kbd>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <IconButton variant="boxed" size="sm" aria-label="Notifications">
            <Bell size={16} />
          </IconButton>
          {onRightPanelToggle && (
            <IconButton
              variant="boxed"
              size="sm"
              onClick={onRightPanelToggle}
              className="hidden lg:inline-flex"
              aria-label="Toggle right panel"
            >
              <PanelRight size={16} />
            </IconButton>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-body text-content-primary transition-colors ${dropdownOpen ? "bg-surface-subtle" : "hover:bg-surface-subtle"}`}
          >
            <Avatar size="sm" name={user?.firstName || user?.email || "?"} />
            <ChevronDown size={16} className="text-content-primary/50" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border-strong bg-surface-primary p-6 shadow-card animate-dropdown-down">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 rounded-md p-2 text-body font-normal text-content-primary hover:bg-surface-subtle"
              >
                <User size={16} />
                Profile
              </Link>
              {hasPermission("users:read") && (
                <Link
                  href="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-md p-2 text-body font-normal text-content-primary hover:bg-surface-subtle"
                >
                  <Shield size={16} />
                  Admin
                </Link>
              )}
              <Divider className="my-2" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md p-2 text-body font-normal text-error hover:bg-surface-subtle"
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
