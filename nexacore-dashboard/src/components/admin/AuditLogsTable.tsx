'use client';

import type { AuditLog } from '@/lib/types';

type AuditLogsTableProps = {
  logs: AuditLog[];
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: 'bg-status-success/10 text-status-success',
  LOGIN_FAILURE: 'bg-status-error/10 text-status-error',
  LOGOUT: 'bg-surface-subtle text-content-secondary',
  REGISTER: 'bg-status-success/10 text-status-success',
  TOKEN_REFRESH: 'bg-surface-subtle text-content-secondary',
  OAUTH_LOGIN: 'bg-status-info/10 text-status-info',
  ACCOUNT_LOCKED: 'bg-status-error/10 text-status-error',
  ACCOUNT_UNLOCKED: 'bg-status-success/10 text-status-success',
  PASSWORD_CHANGE: 'bg-status-warning/10 text-status-warning',
  PROFILE_UPDATE: 'bg-surface-subtle text-content-secondary',
  USER_ROLE_CHANGE: 'bg-status-warning/10 text-status-warning',
  USER_DEACTIVATED: 'bg-status-error/10 text-status-error',
  USER_ACTIVATED: 'bg-status-success/10 text-status-success',
  USER_DELETED: 'bg-status-error/10 text-status-error',
  SUPERADMIN_BYPASS: 'bg-status-warning/10 text-status-warning',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getUserLabel(log: AuditLog): string {
  if (!log.user) return log.userId || '—';
  const name =
    log.user.firstName && log.user.lastName
      ? `${log.user.firstName} ${log.user.lastName}`
      : log.user.email;
  return name;
}

function getTargetLabel(log: AuditLog): string {
  if (!log.targetUserId) return '—';
  if (!log.targetUser) return log.targetUserId;
  const name =
    log.targetUser.firstName && log.targetUser.lastName
      ? `${log.targetUser.firstName} ${log.targetUser.lastName}`
      : log.targetUser.email;
  return name;
}

function getMetadataSummary(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '—';
  const entries = Object.entries(metadata);
  if (entries.length === 0) return '—';
  return entries
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(', ');
}

export default function AuditLogsTable({ logs }: AuditLogsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border-default bg-surface-primary">
      <table className="w-full text-left text-body-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 font-medium text-content-secondary">Time</th>
            <th className="px-4 py-3 font-medium text-content-secondary">Action</th>
            <th className="px-4 py-3 font-medium text-content-secondary">User</th>
            <th className="px-4 py-3 font-medium text-content-secondary">Target</th>
            <th className="px-4 py-3 font-medium text-content-secondary">IP</th>
            <th className="px-4 py-3 font-medium text-content-secondary">Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-border-default last:border-b-0 hover:bg-surface-subtle/50"
            >
              <td className="whitespace-nowrap px-4 py-3 text-content-primary">
                {formatDate(log.createdAt)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${
                    ACTION_COLORS[log.action] || 'bg-surface-subtle text-content-secondary'
                  }`}
                >
                  {log.action.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-content-primary">{getUserLabel(log)}</td>
              <td className="px-4 py-3 text-content-secondary">{getTargetLabel(log)}</td>
              <td className="px-4 py-3 font-mono text-caption text-content-tertiary">
                {log.ipAddress || '—'}
              </td>
              <td className="max-w-[240px] truncate px-4 py-3 text-caption text-content-tertiary" title={getMetadataSummary(log.metadata)}>
                {getMetadataSummary(log.metadata)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
