"use client";

import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import type { AuditLog } from "@/lib/types";

type AuditLogsTableProps = {
  logs: AuditLog[];
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: "bg-success-bg text-success",
  LOGIN_FAILURE: "bg-error-bg text-error",
  LOGOUT: "bg-surface-subtle text-content-secondary",
  REGISTER: "bg-success-bg text-success",
  TOKEN_REFRESH: "bg-surface-subtle text-content-secondary",
  OAUTH_LOGIN: "bg-info-bg text-info",
  OAUTH_LINKED: "bg-success-bg text-success",
  OAUTH_REGISTER: "bg-success-bg text-success",
  OAUTH_UNLINKED: "bg-warning-bg text-warning",
  ACCOUNT_LOCKED: "bg-error-bg text-error",
  ACCOUNT_UNLOCKED: "bg-success-bg text-success",
  PASSWORD_CHANGE: "bg-warning-bg text-warning",
  PROFILE_UPDATE: "bg-surface-subtle text-content-secondary",
  USER_ROLE_CHANGE: "bg-warning-bg text-warning",
  USER_DEACTIVATED: "bg-error-bg text-error",
  USER_ACTIVATED: "bg-success-bg text-success",
  USER_DELETED: "bg-error-bg text-error",
  SUPERADMIN_BYPASS: "bg-warning-bg text-warning",
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
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-caption font-normal ${
          ACTION_COLORS[log.action] ||
          "bg-surface-subtle text-content-secondary"
        }`}
      >
        {log.action.replace(/_/g, " ")}
      </span>
    ),
  },
  {
    key: "user",
    label: "User",
    render: (log) => getUserLabel(log),
  },
  {
    key: "target",
    label: "Target",
    render: (log) => (
      <span className="text-content-secondary">{getTargetLabel(log)}</span>
    ),
  },
  {
    key: "ip",
    label: "IP",
    render: (log) => (
      <span className="font-mono text-caption text-content-tertiary">
        {log.ipAddress || "—"}
      </span>
    ),
  },
  {
    key: "details",
    label: "Details",
    render: (log) => (
      <span
        className="block max-w-[240px] truncate text-caption text-content-tertiary"
        title={getMetadataSummary(log.metadata)}
      >
        {getMetadataSummary(log.metadata)}
      </span>
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
