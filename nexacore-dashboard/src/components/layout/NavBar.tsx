"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Avatar from "@/components/ui/Avatar";
import Divider from "@/components/ui/Divider";
import IconButton from "@/components/ui/IconButton";
import SearchTrigger from "@/components/ui/SearchTrigger";
import {
  PanelLeftOpen,
  Bell,
  Search,
  User,
  Shield,
  LogOut,
  ChevronDown,
} from "lucide-react";

type NavBarProps = {
  onMenuClick?: () => void;
  showSidebarButton?: boolean;
  onRightPanelToggle?: () => void;
  onCommandPaletteOpen?: () => void;
};

export default function NavBar({
  onMenuClick,
  showSidebarButton = false,
  onRightPanelToggle,
  onCommandPaletteOpen,
}: NavBarProps) {
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

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center border-b border-border-default bg-surface-primary">
      {/* Content area — after sidebar */}
      <div
        className={`flex flex-1 items-center justify-between px-4 lg:px-7 ${showSidebarButton ? "" : "lg:ml-[68px]"}`}
      >
        {/* Left side — mobile hamburger + logo */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <IconButton
              variant="boxed"
              size="sm"
              tooltip
              tooltipPosition="right"
              icon={PanelLeftOpen}
              onClick={onMenuClick}
              className="lg:hidden"
              aria-label="Toggle sidebar"
            />
          )}
          <Link href="/dashboard">
            <Image
              src="/em-icon.png"
              alt="EM NexaCore"
              width={60}
              height={25}
              className="shrink-0 dark:invert"
            />
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Command Palette trigger */}
          {onCommandPaletteOpen && (
            <>
              <SearchTrigger
                onClick={onCommandPaletteOpen}
                className="hidden lg:inline-flex"
              />
              <IconButton
                variant="boxed"
                size="sm"
                tooltip="Search (Ctrl+K)"
                icon={Search}
                onClick={onCommandPaletteOpen}
                aria-label="Search"
                className="lg:hidden"
              />
            </>
          )}

          <ThemeToggle />

          {/* Notifications */}
          {onRightPanelToggle && (
            <IconButton
              variant="boxed"
              size="sm"
              tooltip
              icon={Bell}
              onClick={onRightPanelToggle}
              aria-label="Notifications"
            />
          )}

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-body text-content-primary transition-colors ${dropdownOpen ? "bg-surface-subtle" : "hover:bg-surface-subtle"}`}
            >
              <Avatar
                src={user?.avatarUrl}
                size="sm"
                name={user?.firstName || user?.email || "?"}
              />
              <ChevronDown size={16} className="text-content-primary/50" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border-strong bg-surface-primary p-2 shadow-card animate-dropdown-down">
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
      </div>
    </header>
  );
}
