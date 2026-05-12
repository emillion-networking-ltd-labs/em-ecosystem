"use client";

import { useState, useEffect, useCallback } from "react";
import { Monitor, Smartphone, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import {
  revokeSession as apiRevokeSession,
  revokeAllSessions as apiRevokeAllSessions,
} from "@/lib/security-activity-api";
import { HTTP_STATUS } from "@/lib/error-constants";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useNow } from "@/hooks/useNow";
import { PROFILE_TOAST, AUTH_TOAST } from "@/lib/toast-messages";
import type { SessionResponse } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import RateLimitBanner from "@/components/ui/RateLimitBanner";

function parseUserAgent(ua: string | null): {
  label: string;
  isMobile: boolean;
} {
  if (!ua) return { label: "Unknown device", isMobile: false };

  const isMobile = /mobile|android|iphone|ipad/i.test(ua);

  let browser = "Browser";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome/") && !ua.includes("Chromium"))
    browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";

  let os = "";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return {
    label: os ? `${browser} on ${os}` : browser,
    isMobile,
  };
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * SCRUM-347 — staleness color cue. Backend filters sessions with
 * `lastUsedAt < now - 30 min` from the active list, so anything we render
 * is by definition < 30 min old. The visual gradient warns the user that a
 * row may be a force-closed "ghost" session before it disappears:
 *
 *   < 5 min   → tertiary (default, no concern)
 *   5–14 min  → warning (amber: stale, may be ghost)
 *   ≥ 15 min  → error (red: about to disappear)
 *
 * Returns the Tailwind class for the timestamp text only.
 */
function stalenessClass(dateStr: string): string {
  const minutes = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 60000,
  );
  if (minutes < 5) return "text-content-tertiary";
  if (minutes < 15) return "text-warning";
  return "text-error";
}

export default function ActiveSessions({ bare }: { bare?: boolean }) {
  const { addToast } = useToast();
  const { logout } = useAuth();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  // Re-render every 30 s so 'Last active Xm ago' captions tick forward.
  useNow();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // SCRUM-347 follow-up: revoke single session modal (with password input).
  // Pre-fix this was a direct delete on trash icon click; matches the
  // SCRUM-327 trust-device pattern now.
  const [revokeTarget, setRevokeTarget] = useState<SessionResponse | null>(
    null,
  );
  const [revokePassword, setRevokePassword] = useState("");
  const [revokeFieldError, setRevokeFieldError] = useState("");

  // Existing sign-out-all confirm modal (now also gets password input).
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [revokeAllPassword, setRevokeAllPassword] = useState("");
  const [revokeAllFieldError, setRevokeAllFieldError] = useState("");

  const fetchSessions = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoadError(false);
      const data = await apiClient.get<SessionResponse[]>("/auth/sessions", {
        signal,
      });
      if (!signal?.aborted) setSessions(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (!signal?.aborted) setLoadError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSessions(controller.signal);
    return () => controller.abort();
  }, [fetchSessions]);

  // SCRUM-347: refresh the list when the user comes back to the tab. We don't
  // poll (would add load) and we don't have WebSocket/SSE infra. The focus +
  // visibilitychange listener pair covers the common cases:
  // - User logged in from another device while this tab was in the background.
  // - User came back to this tab after several minutes.
  // Pattern matches the GitHub/Google Active Sessions UX (refresh on entry,
  // not real-time push). See OWASP Session Management Cheat Sheet §3.5.
  useEffect(() => {
    const controller = new AbortController();
    const handleRefresh = () => {
      if (document.visibilityState === "visible") {
        void fetchSessions(controller.signal);
      }
    };
    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [fetchSessions]);

  const closeRevokeModal = () => {
    setRevokeTarget(null);
    setRevokePassword("");
    setRevokeFieldError("");
  };

  const closeRevokeAllModal = () => {
    setConfirmAllOpen(false);
    setRevokeAllPassword("");
    setRevokeAllFieldError("");
  };

  // SCRUM-347 follow-up: revoke single session with password re-auth.
  // Pattern matches SCRUM-327 trust-device wrappers — modal stays open on
  // wrong password (toast + retain field value), closes on rate-limit
  // (toast + banner + button-disable), generic error closes with toast.
  const handleRevokeSubmit = async () => {
    if (!revokeTarget) return;
    if (!revokePassword) {
      setRevokeFieldError("Enter your password");
      return;
    }
    setRevokeFieldError("");
    const targetId = revokeTarget.id;
    setRevoking(targetId);
    try {
      await apiRevokeSession(targetId, revokePassword);
      setSessions((prev) => prev.filter((s) => s.id !== targetId));
      closeRevokeModal();
    } catch (err) {
      const apiErr = err as {
        error?: { statusCode?: number; retryAfter?: number };
      };
      const status = apiErr?.error?.statusCode;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        addToast(PROFILE_TOAST.SESSION_REVOKE_INVALID_PASSWORD);
      } else if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC());
        setRateLimit(
          apiErr.error?.retryAfter ?? 60,
          "Too many attempts.",
          "throttle",
        );
        closeRevokeModal();
      } else {
        addToast(PROFILE_TOAST.SESSION_REVOKE_FAILED);
        closeRevokeModal();
      }
    } finally {
      setRevoking(null);
    }
  };

  // Backend /auth/logout-all revokes ALL user sessions (including current) and
  // deny-lists every active access token. The button label and behavior must
  // reflect that — we sign out everywhere AND immediately exit this dashboard
  // session via AuthContext.logout(). Otherwise the user is left with a stale
  // in-memory access token and a confusing UX where pages render without data
  // until the next 401 cascade catches up. See OWASP Session Management Cheat
  // Sheet §5.4: explicit session termination must end the UI session too.
  const signOutAllSessions = async () => {
    if (!revokeAllPassword) {
      setRevokeAllFieldError("Enter your password");
      return;
    }
    setRevokeAllFieldError("");
    setRevokingAll(true);
    try {
      await apiRevokeAllSessions(revokeAllPassword);
      addToast({
        variant: "success",
        title: "All sessions ended",
        description:
          "You have been signed out from this device and all others.",
      });
      closeRevokeAllModal();
      // logout() clears local state, dispatches LOGOUT, which routes to /login
      // via handleAuthFailure-style cleanup. The /auth/logout call inside is a
      // no-op (refresh cookie already cleared by /auth/logout-all) but keeps
      // local cleanup symmetric with the regular logout flow.
      await logout();
    } catch (err) {
      const apiErr = err as {
        error?: { statusCode?: number; retryAfter?: number };
      };
      const status = apiErr?.error?.statusCode;
      setRevokingAll(false);
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        addToast(PROFILE_TOAST.SESSIONS_REVOKE_ALL_INVALID_PASSWORD);
      } else if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        addToast(AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC());
        setRateLimit(
          apiErr.error?.retryAfter ?? 60,
          "Too many attempts.",
          "throttle",
        );
        closeRevokeAllModal();
      } else {
        addToast(PROFILE_TOAST.SESSIONS_REVOKE_FAILED);
        closeRevokeAllModal();
      }
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const header = !bare && (
    <h2 className="text-body font-semibold text-content-primary">
      Active Sessions
    </h2>
  );

  return (
    <div
      className={
        bare
          ? ""
          : "rounded-xl border border-border-strong bg-surface-primary p-6"
      }
    >
      {!bare && <div className="mb-6">{header}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-content-disabled border-t-content-primary" />
        </div>
      ) : loadError ? (
        <p
          className="py-4 text-center text-body text-error"
          role="alert"
          aria-live="polite"
        >
          Failed to load sessions.
        </p>
      ) : sessions.length === 0 ? (
        <p className="py-4 text-center text-body text-content-tertiary">
          No active sessions found.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {sessions.map((session) => {
              const parsed = parseUserAgent(session.userAgent);
              const label = session.deviceInfo || parsed.label;
              const DeviceIcon = parsed.isMobile ? Smartphone : Monitor;

              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 ${
                    session.isCurrent
                      ? "border-status-success/30 bg-status-success/5"
                      : "border-border-components"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary">
                    <DeviceIcon size={24} className="text-content-secondary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-normal text-content-primary">
                        {label}
                      </span>
                      {session.isCurrent && (
                        <Badge variant="success" size="sm">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-caption text-content-tertiary">
                      {session.ipAddress}
                      <span className="text-content-disabled"> · </span>
                      <span
                        className={
                          session.isCurrent
                            ? "text-content-tertiary"
                            : stalenessClass(session.lastUsedAt)
                        }
                      >
                        Last active {formatRelativeTime(session.lastUsedAt)}
                      </span>
                    </p>
                  </div>

                  {!session.isCurrent && (
                    <IconButton
                      variant="danger"
                      size="sm"
                      tooltip
                      disabled={
                        revoking === session.id || rateLimitInfo.isRateLimited
                      }
                      loading={revoking === session.id}
                      onClick={() => {
                        setRevokePassword("");
                        setRevokeFieldError("");
                        setRevokeTarget(session);
                      }}
                      aria-label="Revoke session"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  )}
                </div>
              );
            })}
          </div>

          {otherSessions.length > 0 && (
            <div className="mt-4">
              <Button
                variant="danger"
                size="md"
                fullWidth={false}
                loading={revokingAll}
                disabled={rateLimitInfo.isRateLimited}
                onClick={() => {
                  setRevokeAllPassword("");
                  setRevokeAllFieldError("");
                  setConfirmAllOpen(true);
                }}
                className="w-full sm:w-auto"
              >
                Sign out from all sessions
              </Button>
            </div>
          )}

          {rateLimitInfo.isRateLimited && rateLimitInfo.retryAfter && (
            <div className="mt-3">
              <RateLimitBanner
                retryAfter={rateLimitInfo.retryAfter}
                message="Too many attempts."
                onExpired={clearRateLimit}
              />
            </div>
          )}
        </>
      )}

      {/* SCRUM-347 follow-up: revoke single session modal with password */}
      <ConfirmModal
        open={!!revokeTarget}
        onClose={() => !revoking && closeRevokeModal()}
        onConfirm={handleRevokeSubmit}
        title="Revoke session"
        description="The selected device will be signed out immediately."
        confirmLabel="Revoke"
        variant="danger"
        size="md"
        loading={revoking === revokeTarget?.id}
      >
        <div className="mt-4">
          <Input
            label="Confirm with your password"
            type="password"
            name="revoke-session-password"
            value={revokePassword}
            onChange={(e) => {
              setRevokePassword(e.target.value);
              setRevokeFieldError("");
            }}
            placeholder="Enter your password"
            error={revokeFieldError || undefined}
            autoFocus
          />
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={confirmAllOpen}
        onClose={() => !revokingAll && closeRevokeAllModal()}
        onConfirm={signOutAllSessions}
        title="Sign out from all sessions?"
        description="This will sign you out from this device and every other device where you are currently signed in. You will need to sign in again to continue."
        confirmLabel="Sign out everywhere"
        cancelLabel="Cancel"
        variant="danger"
        size="md"
        loading={revokingAll}
      >
        <div className="mt-4">
          <Input
            label="Confirm with your password"
            type="password"
            name="revoke-all-sessions-password"
            value={revokeAllPassword}
            onChange={(e) => {
              setRevokeAllPassword(e.target.value);
              setRevokeAllFieldError("");
            }}
            placeholder="Enter your password"
            error={revokeAllFieldError || undefined}
            autoFocus
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
