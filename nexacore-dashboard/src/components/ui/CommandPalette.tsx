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
    overlay: "bg-[var(--overlay)] fixed inset-0",
    container:
      "max-w-[550px] rounded-xl border-border-strong bg-surface-primary shadow-card",
    position: "pt-[20vh] — above fold (Linear/Vercel pattern)",
  },
  input: {
    style:
      "text-body placeholder:text-content-tertiary px-4 py-3 border-b border-border-strong",
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
      <div className="fixed inset-0 bg-[var(--overlay)]" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-start justify-center pt-[20vh]">
        <Command
          className="w-full max-w-[550px] overflow-hidden rounded-xl border border-border-strong bg-surface-primary shadow-card"
          shouldFilter={true}
        >
          {/* Input */}
          <div className="flex items-center gap-2 border-b border-border-strong px-4">
            <Search size={16} className="shrink-0 text-content-tertiary" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="w-full bg-transparent py-3 text-body text-content-primary placeholder:text-content-tertiary outline-none"
            />
            <IconButton size="sm" onClick={onClose} aria-label="Close search">
              <X size={16} />
            </IconButton>
          </div>

          {/* Results */}
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-body text-content-tertiary">
              No results found.
            </Command.Empty>

            {/* Pages */}
            <Command.Group
              heading="Pages"
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-content-tertiary"
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
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-content-tertiary"
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
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-content-tertiary"
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
