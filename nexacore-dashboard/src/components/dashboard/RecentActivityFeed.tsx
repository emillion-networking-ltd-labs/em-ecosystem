"use client";

import { useEffect, useState } from "react";
import {
  LogIn,
  LogOut,
  UserPlus,
  KeyRound,
  Shield,
  Settings,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ChartCard from "./ChartCard";
import { apiClient } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

const ACTION_META: Record<string, { icon: LucideIcon; label: string }> = {
  LOGIN_SUCCESS: { icon: LogIn, label: "Logged in" },
  LOGIN_FAILED: { icon: LogIn, label: "Login failed" },
  LOGOUT: { icon: LogOut, label: "Logged out" },
  REGISTER: { icon: UserPlus, label: "Registered" },
  PASSWORD_CHANGE: { icon: KeyRound, label: "Changed password" },
  PASSWORD_RESET_REQUEST: { icon: KeyRound, label: "Requested password reset" },
  PASSWORD_RESET_COMPLETE: { icon: KeyRound, label: "Reset password" },
  ROLE_CHANGE: { icon: Shield, label: "Role updated" },
  ACCOUNT_LOCKED: { icon: Shield, label: "Account locked" },
  ACCOUNT_UNLOCKED: { icon: Shield, label: "Account unlocked" },
  PROFILE_UPDATE: { icon: Settings, label: "Updated profile" },
  ACCOUNT_ACTIVATED: { icon: UserPlus, label: "Account activated" },
  ACCOUNT_DELETED: { icon: LogOut, label: "Account deleted" },
  MFA_ENABLED: { icon: KeyRound, label: "MFA enabled" },
  MFA_DISABLED: { icon: KeyRound, label: "MFA disabled" },
  EMAIL_CHANGE_REQUEST: { icon: Settings, label: "Email change requested" },
  EMAIL_CHANGE_COMPLETE: { icon: Settings, label: "Email changed" },
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
    async function fetchActivity() {
      try {
        const res = await apiClient.get<{ data: AuditLog[] }>(
          "/audit-logs?limit=5&page=1",
        );
        setLogs(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  return (
    <ChartCard title="Recent Activity">
      <div className="space-y-1">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-2">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-black/[0.08] dark:bg-white/[0.08]" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-black/[0.08] dark:bg-white/[0.08]" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-black/[0.08] dark:bg-white/[0.08]" />
              </div>
            </div>
          ))}

        {error && (
          <p className="py-4 text-center text-caption text-content-tertiary">
            Could not load activity
          </p>
        )}

        {!loading && !error && logs.length === 0 && (
          <p className="py-4 text-center text-caption text-content-tertiary">
            No recent activity
          </p>
        )}

        {!loading &&
          !error &&
          logs.map((log) => {
            const meta = ACTION_META[log.action] ?? {
              icon: Activity,
              label: log.action,
            };
            const Icon = meta.icon;
            const userLabel = log.user?.email?.split("@")[0] ?? "System";

            return (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-xl p-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.04]">
                  <Icon size={16} className="text-content-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body text-content-primary">
                    <span className="font-normal">{userLabel}</span>{" "}
                    <span className="text-content-tertiary">{meta.label}</span>
                  </p>
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
