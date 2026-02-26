'use client';

import { Search } from 'lucide-react';
import type { AuditAction } from '@/lib/types';

type AuditLogFiltersProps = {
  action: AuditAction | '';
  onActionChange: (action: AuditAction | '') => void;
  userId: string;
  onUserIdChange: (userId: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
};

const AUDIT_ACTIONS: AuditAction[] = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGOUT',
  'REGISTER',
  'TOKEN_REFRESH',
  'OAUTH_LOGIN',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'PASSWORD_CHANGE',
  'PROFILE_UPDATE',
  'USER_ROLE_CHANGE',
  'USER_DEACTIVATED',
  'USER_ACTIVATED',
  'USER_DELETED',
  'SUPERADMIN_BYPASS',
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
      <select
        value={action}
        onChange={(e) => onActionChange(e.target.value as AuditAction | '')}
        className="h-10 rounded-lg border border-border-default bg-surface-secondary px-3 text-body-sm text-content-primary outline-none"
      >
        <option value="">All actions</option>
        {AUDIT_ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a.replace(/_/g, ' ')}
          </option>
        ))}
      </select>

      {/* User ID filter */}
      <div className="flex h-10 w-56 items-center gap-2 rounded-lg border border-border-default bg-surface-secondary px-3">
        <Search size={14} className="text-content-tertiary" />
        <input
          type="text"
          placeholder="Filter by user ID..."
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          className="flex-1 bg-transparent text-body-sm text-content-primary outline-none placeholder:text-content-placeholder"
        />
      </div>

      {/* Date range */}
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="h-10 rounded-lg border border-border-default bg-surface-secondary px-3 text-body-sm text-content-primary outline-none"
      />
      <span className="text-body-sm text-content-tertiary">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="h-10 rounded-lg border border-border-default bg-surface-secondary px-3 text-body-sm text-content-primary outline-none"
      />
    </div>
  );
}
