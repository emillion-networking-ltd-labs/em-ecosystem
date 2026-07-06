"use client";

import { MonitorDot, ShieldX } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import CopyCell from "@/components/ui/CopyCell";
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
