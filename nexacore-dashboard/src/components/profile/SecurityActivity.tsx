"use client";

import { useState, useEffect, useCallback } from "react";
import { getSecurityActivity } from "@/lib/security-activity-api";
import type { SecurityEvent } from "@/lib/types";
import Pagination from "@/components/ui/Pagination";

const EVENT_CONFIG: Record<
  string,
  { label: string; category: "info" | "success" | "warning" | "danger" }
> = {
  LOGIN_SUCCESS: { label: "Login", category: "success" },
  LOGIN_FAILURE: { label: "Failed Login", category: "danger" },
  OAUTH_LOGIN: { label: "OAuth Login", category: "success" },
  LOGOUT: { label: "Logout", category: "info" },
  PASSWORD_CHANGE: { label: "Password Changed", category: "warning" },
  MFA_ENABLED: { label: "MFA Enabled", category: "success" },
  MFA_DISABLED: { label: "MFA Disabled", category: "warning" },
  ACCOUNT_LOCKED: { label: "Account Locked", category: "danger" },
  ACCOUNT_UNLOCKED: { label: "Account Unlocked", category: "info" },
  BRUTE_FORCE_DETECTED: { label: "Brute Force Detected", category: "danger" },
  CREDENTIAL_STUFFING_DETECTED: {
    label: "Credential Stuffing",
    category: "danger",
  },
  UNUSUAL_LOGIN_HOURS: { label: "Unusual Login Hour", category: "warning" },
  NEW_COUNTRY_LOGIN: { label: "New Country Login", category: "warning" },
  IMPOSSIBLE_TRAVEL_DETECTED: {
    label: "Impossible Travel",
    category: "danger",
  },
  LOGIN_BLOCKED_TRAVEL: { label: "Login Blocked (Travel)", category: "danger" },
  DEVICE_TRUSTED: { label: "Device Trusted", category: "success" },
  DEVICE_UNTRUSTED: { label: "Device Revoked", category: "warning" },
  PASSKEY_REGISTERED: { label: "Passkey Registered", category: "success" },
  PASSKEY_DELETED: { label: "Passkey Deleted", category: "warning" },
  PASSKEY_AUTH_SUCCESS: { label: "Passkey Login", category: "success" },
  PASSKEY_AUTH_FAILURE: { label: "Passkey Login Failed", category: "danger" },
  OAUTH_LINKED: { label: "OAuth Linked", category: "success" },
  OAUTH_REGISTER: { label: "OAuth Register", category: "success" },
  OAUTH_UNLINKED: { label: "OAuth Unlinked", category: "warning" },
  EMAIL_CHANGE_REQUESTED: { label: "Email Change Requested", category: "info" },
  EMAIL_CHANGED: { label: "Email Changed", category: "warning" },
  TOKEN_REFRESH: { label: "Session Refreshed", category: "info" },
  REGISTER: { label: "Account Registered", category: "success" },
};

const CATEGORY_STYLES: Record<string, string> = {
  info: "bg-surface-subtle text-content-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-error/10 text-error",
};

const EVENTS_PER_PAGE = 10;

export default function SecurityActivity() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsMeta, setEventsMeta] = useState({
    total: 0,
    page: 1,
    limit: EVENTS_PER_PAGE,
    totalPages: 1,
  });
  const [eventsLoading, setEventsLoading] = useState(true);

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
    fetchEvents(eventsPage);
  }, [fetchEvents, eventsPage]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-6">
      <h2 className="mb-6 text-body font-semibold uppercase tracking-wider text-content-primary">
        Security Activity
      </h2>

      {/* Recent Security Events */}
      <div>
        {eventsLoading ? (
          <p className="py-4 text-center text-body text-content-tertiary">
            Loading events...
          </p>
        ) : events.length === 0 ? (
          <p className="py-4 text-center text-body text-content-tertiary">
            No security events.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {events.map((event) => {
                const config = EVENT_CONFIG[event.action] || {
                  label: event.action,
                  category: "info" as const,
                };
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-xl border border-border-default p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-caption font-normal ${CATEGORY_STYLES[config.category]}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-1 text-caption text-content-tertiary">
                        {event.ipAddress || "System"}
                        {" · "}
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
    </div>
  );
}
