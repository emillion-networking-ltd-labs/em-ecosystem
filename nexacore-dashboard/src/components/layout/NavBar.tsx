"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import IconButton from "@/components/ui/IconButton";
import {
  PanelLeft,
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

export default function NavBar({
  onMenuClick,
  onRightPanelToggle,
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
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border-components bg-surface-primary px-7">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <IconButton
          variant="boxed"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </IconButton>

        {/* Desktop: sidebar toggle */}
        <div className="hidden items-center gap-2 lg:flex">
          <IconButton
            variant="boxed"
            size="sm"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={16} />
          </IconButton>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

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
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border-components bg-surface-primary p-2 shadow-card animate-dropdown-down">
              <Button
                as={Link}
                href="/profile"
                variant="link"
                size="sm"
                fullWidth
                onClick={() => setDropdownOpen(false)}
                className="justify-start rounded-md p-2 hover:bg-surface-subtle"
              >
                <User size={16} />
                Profile
              </Button>
              {hasPermission("users:read") && (
                <Button
                  as={Link}
                  href="/admin"
                  variant="link"
                  size="sm"
                  fullWidth
                  onClick={() => setDropdownOpen(false)}
                  className="justify-start rounded-md p-2 hover:bg-surface-subtle"
                >
                  <Shield size={16} />
                  Admin
                </Button>
              )}
              <Divider className="my-2" />
              <Button
                variant="link"
                size="sm"
                fullWidth
                onClick={handleLogout}
                className="justify-start rounded-md p-2 text-error hover:bg-surface-subtle"
              >
                <LogOut size={16} />
                Sign out
              </Button>
            </div>
          )}
        </div>

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
    </header>
  );
}
