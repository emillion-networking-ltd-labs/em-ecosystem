"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  User,
  Settings,
  Users,
  FileText,
  Shield,
  Palette,
  LogOut,
  Moon,
  Sun,
  Search,
  X,
} from "lucide-react";
import IconButton from "./IconButton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/hooks/useTheme";
import { apiClient } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import type { SafeUser, PaginatedResponse } from "@/lib/types";

export const commandPaletteSpecs = {
  dialog: {
    overlay: "bg-(--overlay) fixed inset-0",
    container:
      "max-w-[550px] rounded-xl border-line-strong bg-surface-primary shadow-card",
    position:
      "mobile: pt-[68px] px-4 (below header) | desktop: pt-[20vh] (Linear/Vercel pattern)",
  },
  input: {
    style:
      "h-12 text-body leading-6 placeholder:text-content-placeholder px-4 border-b border-line-strong (matches Input md)",
    icon: "Search 16px text-content-tertiary",
  },
  item: {
    style: "text-body text-content-primary px-3 py-2.5 rounded-lg",
    hover: "bg-surface-subtle (aria-selected)",
    icon: "16px text-content-secondary mr-3",
  },
  group: {
    heading:
      "text-caption font-semibold uppercase tracking-wider text-content-tertiary px-3 py-2",
  },
  shortcut: {
    style:
      "text-caption font-mono bg-surface-tertiary rounded-md px-1.5 py-0.5",
  },
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type PageItem = {
  label: string;
  href: string;
  icon: typeof BarChart3;
  permission?: string;
};

const pages: PageItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  {
    label: "User Management",
    href: "/admin",
    icon: Users,
    permission: "users:read",
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
    permission: "audit-logs:read",
  },
  {
    label: "Permissions",
    href: "/admin/permissions",
    icon: Shield,
    permission: "permissions:read",
  },
  {
    label: "Design System",
    href: "/admin/design-system",
    icon: Palette,
    permission: "users:read",
  },
];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch("");
      setUsers([]);
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Debounced user search (admin only)
  const canSearchUsers = hasPermission("users:read");

  useEffect(() => {
    if (!open || !canSearchUsers || search.length < 2) {
      setUsers([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await apiClient.get<PaginatedResponse<SafeUser>>(
          `/users?search=${encodeURIComponent(search)}&limit=5`,
        );
        setUsers(res.data);
      } catch {
        setUsers([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open, canSearchUsers]);

  const runCommand = useCallback(
    (fn: () => void) => {
      onClose();
      fn();
    },
    [onClose],
  );

  const filteredPages = pages.filter(
    (p) => !p.permission || hasPermission(p.permission),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-(--overlay)" onClick={onClose} />

      {/* Dialog — mobile: below header (68px), desktop: 20vh from top */}
      <div className="fixed inset-0 flex items-start justify-center px-4 pt-[68px] lg:px-0 lg:pt-[20vh]">
        <Command
          className="w-full max-w-[550px] overflow-hidden rounded-xl border border-line-strong bg-surface-primary shadow-card"
          shouldFilter={true}
        >
          {/* Input — matches Input md (h-12 px-4 text-body placeholder:text-content-placeholder) */}
          <div className="flex h-12 items-center gap-2 border-b border-line-strong px-4">
            <Search size={16} className="shrink-0 text-content-tertiary" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="min-w-0 flex-1 bg-transparent text-body leading-6 text-content-primary placeholder:text-content-placeholder outline-hidden"
            />
            <IconButton
              size="sm"
              icon={X}
              onClick={onClose}
              aria-label="Close search"
            />
          </div>

          {/* Results */}
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-body text-content-tertiary">
              No results found.
            </Command.Empty>

            {/* Pages */}
            <Command.Group
              heading="Pages"
              className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-caption **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-content-tertiary"
            >
              {filteredPages.map((page) => (
                <Command.Item
                  key={page.href}
                  value={page.label}
                  onSelect={() => runCommand(() => router.push(page.href))}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body text-content-primary aria-selected:bg-surface-subtle"
                >
                  <page.icon
                    size={16}
                    className="shrink-0 text-content-secondary"
                  />
                  {page.label}
                </Command.Item>
              ))}
            </Command.Group>

            {/* Users (admin only) */}
            {canSearchUsers && users.length > 0 && (
              <Command.Group
                heading="Users"
                className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-caption **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-content-tertiary"
              >
                {users.map((user) => (
                  <Command.Item
                    key={user.id}
                    value={`${user.firstName || ""} ${user.lastName || ""} ${user.email}`}
                    onSelect={() =>
                      runCommand(() =>
                        router.push(
                          `/admin?search=${encodeURIComponent(user.email)}`,
                        ),
                      )
                    }
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body text-content-primary aria-selected:bg-surface-subtle"
                  >
                    <Avatar
                      src={user.avatarUrl}
                      name={user.firstName || user.email}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body text-content-primary">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="truncate text-caption text-content-tertiary">
                        {user.email}
                      </p>
                    </div>
                  </Command.Item>
                ))}
                {searchingUsers && (
                  <div className="px-3 py-2 text-caption text-content-tertiary">
                    Searching...
                  </div>
                )}
              </Command.Group>
            )}

            {/* Actions */}
            <Command.Group
              heading="Actions"
              className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-caption **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-content-tertiary"
            >
              <Command.Item
                value="Toggle dark mode"
                onSelect={() => runCommand(toggleTheme)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body text-content-primary aria-selected:bg-surface-subtle"
              >
                {theme === "light" ? (
                  <Moon size={16} className="shrink-0 text-content-secondary" />
                ) : (
                  <Sun size={16} className="shrink-0 text-content-secondary" />
                )}
                Toggle dark mode
              </Command.Item>
              <Command.Item
                value="Sign out"
                onSelect={() => runCommand(logout)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body text-error aria-selected:bg-surface-subtle"
              >
                <LogOut size={16} className="shrink-0" />
                Sign out
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
