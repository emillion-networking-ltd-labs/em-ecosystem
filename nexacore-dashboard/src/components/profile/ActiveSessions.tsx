"use client";

import { useState, useEffect, useCallback } from "react";
import { Monitor, Smartphone, Globe, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import type { SessionResponse } from "@/lib/types";
import Button from "@/components/ui/Button";

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

export default function ActiveSessions() {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoadError(false);
      const data = await apiClient.get<SessionResponse[]>("/auth/sessions");
      setSessions(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      addToast({
        variant: "error",
        title: "Revoke failed",
        description: "Could not revoke the session.",
      });
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    setRevokingAll(true);
    try {
      await apiClient.post("/auth/logout-all", {});
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    } catch {
      addToast({
        variant: "error",
        title: "Revoke failed",
        description: "Could not revoke other sessions.",
      });
    } finally {
      setRevokingAll(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-body-sm font-semibold uppercase tracking-wider text-content-primary">
          Active Sessions
        </h2>
        {otherSessions.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            fullWidth={false}
            loading={revokingAll}
            onClick={revokeAllOtherSessions}
          >
            Revoke all others
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-content-disabled border-t-content-primary" />
        </div>
      ) : loadError ? (
        <p
          className="py-4 text-center text-body-sm text-error"
          role="alert"
          aria-live="polite"
        >
          Failed to load sessions.
        </p>
      ) : sessions.length === 0 ? (
        <p className="py-4 text-center text-body-sm text-content-tertiary">
          No active sessions found.
        </p>
      ) : (
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
                    : "border-border-default"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-subtle">
                  <DeviceIcon size={20} className="text-content-secondary" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-body-sm font-medium text-content-primary">
                      {label}
                    </span>
                    {session.isCurrent && (
                      <span className="shrink-0 rounded-full bg-status-success/10 px-2 py-0.5 text-caption font-medium text-status-success">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-caption text-content-tertiary">
                    <Globe size={12} />
                    <span>{session.ipAddress}</span>
                    <span className="text-content-disabled">·</span>
                    <span>
                      Last active {formatRelativeTime(session.lastUsedAt)}
                    </span>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={revoking === session.id}
                    className="shrink-0 rounded-lg p-2 text-content-tertiary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                    title="Revoke session"
                  >
                    {revoking === session.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-content-disabled border-t-error" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
