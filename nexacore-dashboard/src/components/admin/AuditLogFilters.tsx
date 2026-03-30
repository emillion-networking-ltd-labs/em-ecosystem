"use client";

import type { AuditAction } from "@/lib/types";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";

type AuditLogFiltersProps = {
  action: AuditAction | "";
  onActionChange: (action: AuditAction | "") => void;
  userId: string;
  onUserIdChange: (userId: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
};

const AUDIT_ACTIONS: AuditAction[] = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGOUT",
  "REGISTER",
  "TOKEN_REFRESH",
  "OAUTH_LOGIN",
  "OAUTH_LINKED",
  "OAUTH_REGISTER",
  "OAUTH_UNLINKED",
  "ACCOUNT_LOCKED",
  "ACCOUNT_UNLOCKED",
  "PASSWORD_CHANGE",
  "PROFILE_UPDATE",
  "USER_ROLE_CHANGE",
  "USER_DEACTIVATED",
  "USER_ACTIVATED",
  "USER_DELETED",
  "SUPERADMIN_BYPASS",
];

export default function AuditLogFilters({
  action,
  onActionChange,
  userId,
  onUserIdChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: AuditLogFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Action filter */}
      <Select
        options={[
          { value: "", label: "All actions" },
          ...AUDIT_ACTIONS.map((a) => ({
            value: a,
            label: a.replace(/_/g, " "),
          })),
        ]}
        value={action}
        onChange={(v) => onActionChange(v as AuditAction | "")}
        placeholder="All actions"
        size="md"
      />

      {/* User ID filter */}
      <div className="w-56">
        <Input
          name="userId"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          placeholder="Filter by user ID..."
          size="md"
        />
      </div>

      {/* Date range */}
      <DateInput value={startDate} onChange={onStartDateChange} size="md" />
      <span className="text-body text-content-tertiary">to</span>
      <DateInput value={endDate} onChange={onEndDateChange} size="md" />
    </div>
  );
}
