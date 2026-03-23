"use client";

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
  return (
    <div className="overflow-x-auto rounded-2xl border border-border-default bg-surface-primary">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              User
            </th>
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              Email
            </th>
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              Role
            </th>
            <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              Status
            </th>
            <th className="px-4 py-3 text-right text-caption font-semibold uppercase tracking-wider text-content-tertiary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isLocked = !user.isActive;
            const statusLabel = isLocked
              ? "Locked"
              : user.isActive
                ? "Active"
                : "Inactive";
            const statusDotClass = isLocked
              ? "bg-error"
              : user.isActive
                ? "bg-success"
                : "bg-content-disabled";

            return (
              <tr
                key={user.id}
                className="border-b border-border-default last:border-b-0 hover:bg-surface-subtle"
              >
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-circle bg-surface-subtle">
                      <span className="text-caption font-semibold text-content-primary">
                        {(
                          user.firstName?.[0] ||
                          user.email[0] ||
                          "?"
                        ).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-body-sm font-normal text-content-primary">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email.split("@")[0]}
                    </span>
                  </div>
                </td>

                {/* Email */}
                <td className="px-4 py-3 text-body-sm text-content-primary">
                  {user.email}
                </td>

                {/* Role */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-caption font-normal ${roleBadgeClasses[user.role]}`}
                  >
                    {user.role}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${statusDotClass}`}
                    />
                    <span
                      className={`text-body-sm ${
                        isLocked
                          ? "text-error"
                          : user.isActive
                            ? "text-content-primary"
                            : "text-content-disabled"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <ActionDropdown
                    user={user}
                    onChangeRole={onChangeRole}
                    onToggleLock={onToggleLock}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
