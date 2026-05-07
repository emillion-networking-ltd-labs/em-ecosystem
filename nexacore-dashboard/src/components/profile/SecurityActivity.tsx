"use client";

import { useState, useEffect, useCallback } from "react";
import { getSecurityActivity } from "@/lib/security-activity-api";
import type { SecurityEvent } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 rows" },
  { value: "20", label: "20 rows" },
  { value: "50", label: "50 rows" },
];

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
  SUPERADMIN_BYPASS: { label: "Superadmin Bypass", category: "warning" },
  PROFILE_UPDATE: { label: "Profile Updated", category: "info" },
  USER_ROLE_CHANGE: { label: "Role Changed", category: "warning" },
  USER_DEACTIVATED: { label: "User Deactivated", category: "danger" },
  USER_ACTIVATED: { label: "User Activated", category: "success" },
  USER_DELETED: { label: "User Deleted", category: "danger" },
};

const CATEGORY_BADGE: Record<
  string,
  "default" | "success" | "warning" | "error" | "info"
> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
};

const EVENTS_PER_PAGE = 10;

export default function SecurityActivity() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [pageSize, setPageSize] = useState(EVENTS_PER_PAGE);
  const [eventsMeta, setEventsMeta] = useState({
    total: 0,
    page: 1,
    limit: EVENTS_PER_PAGE,
    totalPages: 1,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchEvents = useCallback(
    async (page: number) => {
      setIsFetching(true);
      try {
        const res = await getSecurityActivity(page, pageSize);
        setEvents(res.data);
        setEventsMeta(res.meta);
      } catch {
        setLoadError(true);
      } finally {
        setIsFetching(false);
        setInitialLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchEvents(eventsPage);
    return () => controller.abort();
  }, [fetchEvents, eventsPage]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="rounded-xl border border-border-strong bg-surface-primary p-6">
      <h2 className="mb-6 text-body font-semibold text-content-primary">
        Security Activity
      </h2>

      {/* Recent Security Events */}
      <div>
        {initialLoading ? (
          <div
            role="status"
            aria-label="Loading events"
            className="flex items-center justify-center py-8"
          >
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-content-secondary border-t-transparent" />
          </div>
        ) : loadError ? (
          <p className="py-4 text-center text-body text-error">
            Failed to load security events.
          </p>
        ) : events.length === 0 ? (
          <p className="py-4 text-center text-body text-content-tertiary">
            No security events.
          </p>
        ) : (
          <>
            <div
              className={`space-y-2 transition-opacity duration-150 ${isFetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}
            >
              {events.map((event) => {
                const config = EVENT_CONFIG[event.action] || {
                  label: event.action,
                  category: "warning" as const,
                };
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-xl border border-border-components p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={CATEGORY_BADGE[config.category]}
                          size="sm"
                        >
                          {config.label}
                        </Badge>
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

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption text-content-tertiary">
                  Rows per page
                </span>
                <Select
                  options={PAGE_SIZE_OPTIONS}
                  value={String(pageSize)}
                  onChange={(v) => {
                    setPageSize(Number(v));
                    setEventsPage(1);
                  }}
                  size="sm"
                />
                <span className="text-caption text-content-tertiary">
                  {eventsMeta.total} total entries
                </span>
              </div>
              {eventsMeta.totalPages > 1 && (
                <Pagination
                  currentPage={eventsMeta.page}
                  totalPages={eventsMeta.totalPages}
                  onPageChange={setEventsPage}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
