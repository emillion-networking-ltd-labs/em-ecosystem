"use client";

import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import type { SafeUser, UserRole } from "@/lib/types";
import ActionDropdown from "./ActionDropdown";

type UsersTableProps = {
  users: SafeUser[];
  onChangeRole: (user: SafeUser) => void;
  onToggleLock: (user: SafeUser) => void;
  onDelete: (user: SafeUser) => void;
};

const roleBadgeClasses: Record<UserRole, string> = {
  SUPERADMIN: "bg-warning-bg text-warning",
  ADMIN: "bg-info-bg text-info",
  USER: "bg-surface-subtle text-content-secondary",
};

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
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-circle bg-surface-subtle">
            <span className="text-caption font-semibold text-content-primary">
              {(user.firstName?.[0] || user.email[0] || "?").toUpperCase()}
            </span>
          </div>
          <span className="text-body font-normal text-content-primary">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email.split("@")[0]}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (user) => user.email,
    },
    {
      key: "role",
      label: "Role",
      render: (user) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-caption font-normal ${roleBadgeClasses[user.role]}`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (user) => {
        const isLocked = !user.isActive;
        const statusLabel = isLocked ? "Locked" : "Active";
        const statusDotClass = isLocked ? "bg-error" : "bg-success";
        return (
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
            <span
              className={`text-body ${isLocked ? "text-error" : "text-content-primary"}`}
            >
              {statusLabel}
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
