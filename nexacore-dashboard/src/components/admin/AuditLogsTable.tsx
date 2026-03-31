"use client";

import { useState, useRef } from "react";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
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
  LOGOUT: "default",
  REGISTER: "success",
  TOKEN_REFRESH: "default",
  OAUTH_LOGIN: "info",
  OAUTH_LINKED: "success",
  OAUTH_REGISTER: "success",
  OAUTH_UNLINKED: "warning",
  ACCOUNT_LOCKED: "error",
  ACCOUNT_UNLOCKED: "success",
  PASSWORD_CHANGE: "warning",
  PROFILE_UPDATE: "default",
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

function CopyCell({
  value,
  maxWidth,
  className = "",
}: {
  value: string;
  maxWidth: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const tableRef = useRef<HTMLElement | null>(null);

  if (value === "—") {
    return <span className={`text-content-tertiary ${className}`}>—</span>;
  }

  const handleClick = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!tableRef.current) {
      tableRef.current = (e.target as HTMLElement).closest(".card-flat");
    }
    const table = tableRef.current?.getBoundingClientRect();
    if (table) {
      setPos({
        x: Math.min(e.clientX + 12, table.right - 320),
        y: Math.min(e.clientY + 12, table.bottom - 40),
      });
    } else {
      setPos({ x: e.clientX + 12, y: e.clientY + 12 });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setCopied(false);
          tableRef.current = null;
        }}
        onMouseMove={handleMouseMove}
        className={`block truncate text-left transition-colors hover:text-content-primary ${maxWidth} ${className}`}
      >
        {value}
      </button>
      {hover && (
        <div
          className={`pointer-events-none fixed z-50 max-w-xs rounded-lg border px-3 py-2 text-caption shadow-card ${
            copied
              ? "border-success/30 bg-success-bg text-success"
              : "border-border-components bg-surface-primary text-content-primary"
          }`}
          style={{ left: pos.x, top: pos.y }}
        >
          {copied ? "Copied!" : value}
        </div>
      )}
    </div>
  );
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
        {log.action.replace(/_/g, " ")}
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
