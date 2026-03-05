'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getActiveSessions,
  getSecurityActivity,
  revokeSession,
  revokeAllSessions,
} from '@/lib/security-activity-api';
import type { SessionResponse, SecurityEvent } from '@/lib/types';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';

const EVENT_CONFIG: Record<
  string,
  { label: string; category: 'info' | 'success' | 'warning' | 'danger' }
> = {
  LOGIN_SUCCESS: { label: 'Login', category: 'success' },
  LOGIN_FAILURE: { label: 'Failed Login', category: 'danger' },
  OAUTH_LOGIN: { label: 'OAuth Login', category: 'success' },
  LOGOUT: { label: 'Logout', category: 'info' },
  PASSWORD_CHANGE: { label: 'Password Changed', category: 'warning' },
  MFA_ENABLED: { label: 'MFA Enabled', category: 'success' },
  MFA_DISABLED: { label: 'MFA Disabled', category: 'warning' },
  ACCOUNT_LOCKED: { label: 'Account Locked', category: 'danger' },
  ACCOUNT_UNLOCKED: { label: 'Account Unlocked', category: 'info' },
  BRUTE_FORCE_DETECTED: { label: 'Brute Force Detected', category: 'danger' },
  CREDENTIAL_STUFFING_DETECTED: { label: 'Credential Stuffing', category: 'danger' },
  UNUSUAL_LOGIN_HOURS: { label: 'Unusual Login Hour', category: 'warning' },
  NEW_COUNTRY_LOGIN: { label: 'New Country Login', category: 'warning' },
  IMPOSSIBLE_TRAVEL_DETECTED: { label: 'Impossible Travel', category: 'danger' },
  LOGIN_BLOCKED_TRAVEL: { label: 'Login Blocked (Travel)', category: 'danger' },
  DEVICE_TRUSTED: { label: 'Device Trusted', category: 'success' },
  DEVICE_UNTRUSTED: { label: 'Device Revoked', category: 'warning' },
  PASSKEY_REGISTERED: { label: 'Passkey Registered', category: 'success' },
  PASSKEY_DELETED: { label: 'Passkey Deleted', category: 'warning' },
  PASSKEY_AUTH_SUCCESS: { label: 'Passkey Login', category: 'success' },
  PASSKEY_AUTH_FAILURE: { label: 'Passkey Login Failed', category: 'danger' },
  OAUTH_UNLINKED: { label: 'OAuth Unlinked', category: 'warning' },
  EMAIL_CHANGE_REQUESTED: { label: 'Email Change Requested', category: 'info' },
  EMAIL_CHANGED: { label: 'Email Changed', category: 'warning' },
};

const CATEGORY_STYLES: Record<string, string> = {
  info: 'bg-surface-subtle text-content-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-error/10 text-error',
};

const EVENTS_PER_PAGE = 10;

export default function SecurityActivity() {
  const { logout } = useAuth();

  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsMeta, setEventsMeta] = useState({
    total: 0,
    page: 1,
    limit: EVENTS_PER_PAGE,
    totalPages: 1,
  });
  const [eventsLoading, setEventsLoading] = useState(true);

  const [revoking, setRevoking] = useState<string | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await getActiveSessions();
      setSessions(data);
    } catch {
      // silent — empty state shown
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (page: number) => {
    setEventsLoading(true);
    try {
      const res = await getSecurityActivity(page, EVENTS_PER_PAGE);
      setEvents(res.data);
      setEventsMeta(res.meta);
    } catch {
      // silent — empty state shown
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchEvents(eventsPage);
  }, [fetchEvents, eventsPage]);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      // silent
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      await revokeAllSessions();
      await logout();
    } catch {
      // silent
    } finally {
      setRevokingAll(false);
      setShowRevokeAll(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
      <h2 className="mb-6 text-body-sm font-semibold uppercase tracking-wider text-content-primary">
        Security Activity
      </h2>

      {/* Active Sessions */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-body-sm font-medium text-content-primary">Active Sessions</h3>
          {sessions.length > 1 && (
            <button
              onClick={() => setShowRevokeAll(true)}
              className="text-caption text-error hover:underline"
            >
              Revoke All
            </button>
          )}
        </div>

        {sessionsLoading ? (
          <p className="py-4 text-center text-body-sm text-content-tertiary">
            Loading sessions...
          </p>
        ) : sessions.length === 0 ? (
          <p className="py-4 text-center text-body-sm text-content-tertiary">
            No active sessions.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-border-default p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-medium text-content-primary">
                      {session.deviceInfo || 'Unknown Device'}
                    </span>
                    {session.isCurrent && (
                      <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-caption text-content-tertiary">
                    {session.ipAddress}
                    {session.locationCity && ` · ${session.locationCity}`}
                    {session.locationCountry && `, ${session.locationCountry}`}
                    {' · '}
                    {formatDate(session.lastUsedAt)}
                  </p>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={revoking === session.id}
                    className="ml-3 shrink-0 rounded-md border border-error-border px-3 py-1 text-caption text-error hover:bg-error-bg disabled:opacity-50"
                  >
                    {revoking === session.id ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mb-6 border-t border-border-default" />

      {/* Recent Security Events */}
      <div>
        <h3 className="mb-3 text-body-sm font-medium text-content-primary">Recent Events</h3>

        {eventsLoading ? (
          <p className="py-4 text-center text-body-sm text-content-tertiary">
            Loading events...
          </p>
        ) : events.length === 0 ? (
          <p className="py-4 text-center text-body-sm text-content-tertiary">
            No security events.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {events.map((event) => {
                const config = EVENT_CONFIG[event.action] || {
                  label: event.action,
                  category: 'info' as const,
                };
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-xl border border-border-default p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_STYLES[config.category]}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-1 text-caption text-content-tertiary">
                        {event.ipAddress || 'System'}
                        {' · '}
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={eventsMeta.page}
              totalPages={eventsMeta.totalPages}
              onPageChange={setEventsPage}
            />
          </>
        )}
      </div>

      {/* Revoke All confirmation modal */}
      <ConfirmModal
        open={showRevokeAll}
        onClose={() => setShowRevokeAll(false)}
        onConfirm={handleRevokeAll}
        title="Revoke All Sessions"
        description="This will log you out of all devices and end all active sessions. You will need to log in again."
        confirmLabel="Revoke All"
        variant="danger"
        loading={revokingAll}
      />
    </div>
  );
}
