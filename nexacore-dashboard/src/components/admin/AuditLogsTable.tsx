"use client";

import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import CopyCell from "@/components/ui/CopyCell";
import type { AuditLog } from "@/lib/types";

type AuditLogsTableProps = {
  logs: AuditLog[];
};

const ACTION_BADGE_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "error" | "info"
> = {
  LOGIN_SUCCESS: "success",
  LOGIN_FAILURE: "error",
  LOGOUT: "info",
  REGISTER: "success",
  TOKEN_REFRESH: "info",
  OAUTH_LOGIN: "success",
  OAUTH_LINKED: "success",
  OAUTH_REGISTER: "success",
  OAUTH_UNLINKED: "warning",
  ACCOUNT_LOCKED: "error",
  ACCOUNT_UNLOCKED: "success",
  PASSWORD_CHANGE: "warning",
  PROFILE_UPDATE: "info",
  USER_ROLE_CHANGE: "warning",
  USER_DEACTIVATED: "error",
  USER_ACTIVATED: "success",
  USER_DELETED: "error",
  SUPERADMIN_BYPASS: "warning",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getUserLabel(log: AuditLog): string {
  if (!log.user) return log.userId || "—";
  return log.user.firstName && log.user.lastName
    ? `${log.user.firstName} ${log.user.lastName}`
    : log.user.email;
}

function getTargetLabel(log: AuditLog): string {
  if (!log.targetUserId) return "—";
  if (!log.targetUser) return log.targetUserId;
  return log.targetUser.firstName && log.targetUser.lastName
    ? `${log.targetUser.firstName} ${log.targetUser.lastName}`
    : log.targetUser.email;
}

function getMetadataSummary(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—";
  const entries = Object.entries(metadata);
  if (entries.length === 0) return "—";
  return entries
    .map(
      ([k, v]) =>
        `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
    )
    .join(", ");
}

const columns: ColumnDef<AuditLog>[] = [
  {
    key: "time",
    label: "Time",
    render: (log) => (
      <span className="whitespace-nowrap">{formatDate(log.createdAt)}</span>
    ),
  },
  {
    key: "action",
    label: "Action",
    render: (log) => (
      <Badge
        variant={ACTION_BADGE_VARIANT[log.action] || "default"}
        size="sm"
        className="whitespace-nowrap"
      >
        {log.action
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())}
      </Badge>
    ),
  },
  {
    key: "user",
    label: "User",
    render: (log) => (
      <CopyCell
        value={getUserLabel(log)}
        maxWidth="max-w-[160px]"
        className="text-content-primary"
      />
    ),
  },
  {
    key: "target",
    label: "Target",
    render: (log) => (
      <CopyCell
        value={getTargetLabel(log)}
        maxWidth="max-w-[180px]"
        className="text-content-secondary"
      />
    ),
  },
  {
    key: "ip",
    label: "IP",
    render: (log) => (
      <span className="whitespace-nowrap font-mono text-caption text-content-tertiary">
        {log.ipAddress || "—"}
      </span>
    ),
  },
  {
    key: "details",
    label: "Details",
    render: (log) => (
      <CopyCell
        value={getMetadataSummary(log.metadata)}
        maxWidth="max-w-[240px]"
        className="font-mono text-caption text-content-tertiary"
      />
    ),
  },
];

export default function AuditLogsTable({ logs }: AuditLogsTableProps) {
  return (
    <DataTable
      data={logs}
      columns={columns}
      keyExtractor={(log) => log.id}
      emptyMessage="No audit logs found."
    />
  );
}
