"use client";

import { useState, useRef } from "react";
import { MonitorDot, ShieldX } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import type { SafeUser, UserRole } from "@/lib/types";
import ActionDropdown from "./ActionDropdown";

type UsersTableProps = {
  users: SafeUser[];
  onChangeRole: (user: SafeUser) => void;
  onToggleLock: (user: SafeUser) => void;
  onDelete: (user: SafeUser) => void;
};

const roleBadgeVariant: Record<UserRole, "warning" | "info" | "default"> = {
  SUPERADMIN: "warning",
  ADMIN: "info",
  USER: "default",
};

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

export default function UsersTable({
  users,
  onChangeRole,
  onToggleLock,
  onDelete,
}: UsersTableProps) {
  const columns: ColumnDef<SafeUser>[] = [
    {
      key: "user",
      label: "User",
      render: (user) => {
        const name =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email.split("@")[0];
        return (
          <div className="flex items-center gap-3">
            <Avatar src={user.avatarUrl} name={name} size="sm" />
            <CopyCell
              value={name}
              maxWidth="max-w-[160px]"
              className="text-body font-normal text-content-primary"
            />
          </div>
        );
      },
    },
    {
      key: "email",
      label: "Email",
      render: (user) => (
        <CopyCell
          value={user.email}
          maxWidth="max-w-[200px]"
          className="text-body text-content-secondary"
        />
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (user) => (
        <Badge variant={roleBadgeVariant[user.role]} size="sm">
          {user.role}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (user) => {
        const isLocked = !user.isActive;
        return (
          <div className="flex items-center gap-1.5 text-body">
            {isLocked ? (
              <ShieldX size={16} className="text-error" />
            ) : (
              <MonitorDot size={16} className="text-success" />
            )}
            <span className={isLocked ? "text-error" : "text-content-primary"}>
              {isLocked ? "Locked" : "Active"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (user) => (
        <ActionDropdown
          user={user}
          onChangeRole={onChangeRole}
          onToggleLock={onToggleLock}
          onDelete={onDelete}
        />
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      keyExtractor={(user) => user.id}
      emptyMessage="No users found."
    />
  );
}
