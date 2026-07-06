"use client";

import { useEffect, useState } from "react";
import {
  LogIn,
  LogOut,
  UserPlus,
  UserX,
  UserCog,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Fingerprint,
  MonitorSmartphone,
  Link,
  Mail,
  RefreshCw,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ChartCard from "@/components/ui/ChartCard";
import IconBadge from "@/components/ui/IconBadge";
import Badge from "@/components/ui/Badge";
import { apiClient } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const ACTION_META: Record<
  string,
  { icon: LucideIcon; label: string; badge: BadgeVariant }
> = {
  LOGIN_SUCCESS: { icon: LogIn, label: "Logged in", badge: "success" },
  LOGIN_FAILURE: { icon: LogIn, label: "Login failed", badge: "error" },
  LOGOUT: { icon: LogOut, label: "Logged out", badge: "info" },
  REGISTER: { icon: UserPlus, label: "Registered", badge: "success" },
  PASSWORD_CHANGE: {
    icon: KeyRound,
    label: "Changed password",
    badge: "warning",
  },
  PASSWORD_RESET_REQUEST: {
    icon: KeyRound,
    label: "Requested reset",
    badge: "info",
  },
  PASSWORD_RESET_COMPLETE: {
    icon: KeyRound,
    label: "Reset password",
    badge: "warning",
  },
  USER_ROLE_CHANGE: { icon: UserCog, label: "Role updated", badge: "warning" },
  ACCOUNT_LOCKED: { icon: ShieldOff, label: "Account locked", badge: "error" },
  ACCOUNT_UNLOCKED: {
    icon: ShieldCheck,
    label: "Account unlocked",
    badge: "success",
  },
  PROFILE_UPDATE: { icon: UserCog, label: "Updated profile", badge: "info" },
  ACCOUNT_ACTIVATED: {
    icon: UserPlus,
    label: "Account activated",
    badge: "success",
  },
  ACCOUNT_DELETED: { icon: UserX, label: "Account deleted", badge: "error" },
  MFA_ENABLED: { icon: ShieldCheck, label: "MFA enabled", badge: "success" },
  MFA_DISABLED: { icon: ShieldOff, label: "MFA disabled", badge: "warning" },
  EMAIL_CHANGE_REQUESTED: {
    icon: Mail,
    label: "Email change requested",
    badge: "info",
  },
  EMAIL_CHANGED: { icon: Mail, label: "Email changed", badge: "warning" },
  SUPERADMIN_BYPASS: {
    icon: ShieldAlert,
    label: "Superadmin Bypass",
    badge: "warning",
  },
  TOKEN_REFRESH: { icon: RefreshCw, label: "Session Refreshed", badge: "info" },
  OAUTH_LOGIN: { icon: LogIn, label: "OAuth Login", badge: "success" },
  OAUTH_REGISTER: { icon: UserPlus, label: "OAuth Register", badge: "success" },
  OAUTH_LINKED: { icon: Link, label: "OAuth Linked", badge: "success" },
  OAUTH_UNLINKED: { icon: Link, label: "OAuth Unlinked", badge: "warning" },
  USER_DEACTIVATED: { icon: UserX, label: "User Deactivated", badge: "error" },
  USER_ACTIVATED: { icon: UserPlus, label: "User Activated", badge: "success" },
  USER_DELETED: { icon: UserX, label: "User Deleted", badge: "error" },
  PASSKEY_REGISTERED: {
    icon: Fingerprint,
    label: "Passkey Registered",
    badge: "success",
  },
  PASSKEY_DELETED: {
    icon: Fingerprint,
    label: "Passkey Deleted",
    badge: "warning",
  },
  PASSKEY_AUTH_SUCCESS: {
    icon: Fingerprint,
    label: "Passkey Login",
    badge: "success",
  },
  PASSKEY_AUTH_FAILURE: {
    icon: Fingerprint,
    label: "Passkey Login Failed",
    badge: "error",
  },
  DEVICE_TRUSTED: {
    icon: MonitorSmartphone,
    label: "Device Trusted",
    badge: "success",
  },
  DEVICE_UNTRUSTED: {
    icon: MonitorSmartphone,
    label: "Device Revoked",
    badge: "warning",
  },
};

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function RecentActivityFeed() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchActivity() {
      try {
        const res = await apiClient.get<{ data: AuditLog[] }>(
          "/audit-logs?limit=5&page=1",
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setLogs(res.data);
      } catch {
        if (controller.signal.aborted) return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchActivity();
    return () => controller.abort();
  }, []);

  return (
    <ChartCard title="Recent Activity">
      <div className="space-y-1">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-2">
              <div className="h-10 w-10 animate-pulse rounded-md bg-black/8 dark:bg-white/8" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-black/8 dark:bg-white/8" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-black/8 dark:bg-white/8" />
              </div>
            </div>
          ))}

        {error && (
          <p className="py-4 text-center text-body text-content-tertiary">
            Could not load activity
          </p>
        )}

        {!loading && !error && logs.length === 0 && (
          <p className="py-4 text-center text-body text-content-tertiary">
            No recent activity
          </p>
        )}

        {!loading &&
          !error &&
          logs.map((log) => {
            const meta = ACTION_META[log.action] ?? {
              icon: Activity,
              label: log.action
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase()),
              badge: "info" as BadgeVariant,
            };
            const Icon = meta.icon;
            const userLabel = log.user?.email?.split("@")[0] ?? "System";

            return (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-xl p-2"
              >
                <IconBadge size="md">
                  <Icon size={24} />
                </IconBadge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-body font-semibold text-content-primary">
                      {userLabel}
                    </span>
                    <Badge variant={meta.badge} size="sm">
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-caption text-content-tertiary">
                    {formatRelativeTime(log.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </ChartCard>
  );
}
