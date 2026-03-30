"use client";

import { useState, useEffect, useCallback } from "react";
// Server returns qrCodeDataUrl as a pre-rendered PNG data URL — display directly via <img>
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Input from "@/components/ui/Input";
import type { MfaSetupResponse, MfaStatusResponse } from "@/lib/types";

type MfaView =
  | "status"
  | "setup"
  | "verify"
  | "recovery-codes"
  | "disable"
  | "regenerate";

export default function MfaSetup() {
  const { user, refreshSession } = useAuth();
  const [view, setView] = useState<MfaView>("status");
  const [status, setStatus] = useState<MfaStatusResponse | null>(null);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiClient.get<MfaStatusResponse>("/auth/mfa/status");
      setStatus(data);
    } catch {
      // Silently fail — user might not have MFA
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSetup = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.post<MfaSetupResponse>(
        "/auth/mfa/setup",
        {},
      );
      setSetupData(data);
      setRecoveryCodes(data.recoveryCodes);
      setView("setup");
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || "Failed to start MFA setup");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/mfa/verify-setup", {
        token: verifyCode.trim(),
      });
      setView("recovery-codes");
      setVerifyCode("");
      await fetchStatus();
      await refreshSession();
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      await apiClient.delete("/auth/mfa", {
        body: JSON.stringify({ password }),
        headers: { "Content-Type": "application/json" },
      });
      setPassword("");
      setView("status");
      setSetupData(null);
      await fetchStatus();
      await refreshSession();
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || "Failed to disable MFA");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.post<{ recoveryCodes: string[] }>(
        "/auth/mfa/recovery-codes",
        { password },
      );
      setRecoveryCodes(data.recoveryCodes);
      setPassword("");
      setView("recovery-codes");
      await fetchStatus();
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr?.error?.message || "Failed to regenerate recovery codes");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "secret" | "codes") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "secret") {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedCodes(true);
        setTimeout(() => setCopiedCodes(false), 2000);
      }
    } catch {
      // Clipboard API may not be available
    }
  };

  const mfaEnabled = user?.mfaEnabled || status?.mfaEnabled;

  // Recovery codes view (after setup or regeneration)
  if (view === "recovery-codes") {
    return (
      <div className="rounded-xl border border-border-default bg-surface-primary p-6">
        <h2 className="mb-6 text-body font-semibold uppercase tracking-wider text-content-primary">
          Recovery Codes
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-warning-border bg-warning-bg p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
            <p className="text-caption text-content-primary">
              Save these recovery codes in a secure location. Each code can only
              be used once. If you lose access to your authenticator app, you
              can use these codes to sign in.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border-default bg-surface-subtle p-4">
            {recoveryCodes.map((code, i) => (
              <code
                key={i}
                className="select-all font-mono text-body text-content-primary"
              >
                {code}
              </code>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              fullWidth={false}
              onClick={() => copyToClipboard(recoveryCodes.join("\n"), "codes")}
            >
              {copiedCodes ? <Check size={16} /> : <Copy size={16} />}
              {copiedCodes ? "Copied" : "Copy all"}
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              size="md"
              fullWidth={false}
              onClick={() => {
                setView("status");
                setRecoveryCodes([]);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Setup QR view
  if (view === "setup" && setupData) {
    return (
      <div className="rounded-xl border border-border-default bg-surface-primary p-6">
        <h2 className="mb-6 text-body font-semibold uppercase tracking-wider text-content-primary">
          Set Up Two-Factor Authentication
        </h2>

        <div className="space-y-6">
          <p className="text-caption text-content-secondary">
            Scan the QR code below with your authenticator app (Google
            Authenticator, Authy, 1Password, etc.).
          </p>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="rounded-xl border border-border-default bg-white p-4">
              <img
                src={setupData.qrCodeDataUrl}
                alt="MFA QR Code"
                width={200}
                height={200}
              />
            </div>
          </div>

          {/* Manual entry secret */}
          <div className="space-y-2">
            <p className="text-caption text-content-secondary">
              Or enter this secret manually:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 select-all rounded-lg border border-border-default bg-surface-subtle px-3 py-2 font-mono text-body text-content-primary">
                {setupData.secret}
              </code>
              <IconButton
                variant="boxed"
                size="sm"
                onClick={() => copyToClipboard(setupData.secret, "secret")}
                aria-label="Copy secret"
              >
                {copiedSecret ? <Check size={16} /> : <Copy size={16} />}
              </IconButton>
            </div>
          </div>

          {/* Verify code form */}
          <form onSubmit={handleVerifySetup} className="space-y-4">
            <Input
              label="Verification Code"
              name="totpCode"
              type="text"
              inputMode="numeric"
              value={verifyCode}
              onChange={(e) => {
                setError("");
                setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              placeholder="Enter 6-digit code"
              autoComplete="one-time-code"
              error={error || undefined}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="md"
                fullWidth={false}
                onClick={() => {
                  setView("status");
                  setSetupData(null);
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="md"
                fullWidth={false}
                loading={loading}
              >
                Verify & Enable
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Disable MFA view
  if (view === "disable") {
    return (
      <div className="rounded-xl border border-border-default bg-surface-primary p-6">
        <h2 className="mb-6 text-body font-semibold uppercase tracking-wider text-content-primary">
          Disable Two-Factor Authentication
        </h2>

        <form onSubmit={handleDisable} className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-error-border bg-error-bg p-3">
            <ShieldOff size={16} className="mt-0.5 shrink-0 text-error" />
            <p className="text-caption text-content-primary">
              Disabling MFA will make your account less secure. You will need
              your password to confirm.
            </p>
          </div>

          <Input
            label="Confirm Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setError("");
              setPassword(e.target.value);
            }}
            placeholder="Enter your password"
            error={error || undefined}
          />

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="md"
              fullWidth={false}
              onClick={() => {
                setView("status");
                setPassword("");
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              fullWidth={false}
              loading={loading}
            >
              Disable MFA
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Regenerate recovery codes view
  if (view === "regenerate") {
    return (
      <div className="rounded-xl border border-border-default bg-surface-primary p-6">
        <h2 className="mb-6 text-body font-semibold uppercase tracking-wider text-content-primary">
          Regenerate Recovery Codes
        </h2>

        <form onSubmit={handleRegenerate} className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-warning-border bg-warning-bg p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
            <p className="text-caption text-content-primary">
              This will invalidate all existing recovery codes. Make sure to
              save the new ones.
            </p>
          </div>

          <Input
            label="Confirm Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setError("");
              setPassword(e.target.value);
            }}
            placeholder="Enter your password"
            error={error || undefined}
          />

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="md"
              fullWidth={false}
              onClick={() => {
                setView("status");
                setPassword("");
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="md" fullWidth={false} loading={loading}>
              Regenerate
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Default: Status view
  return (
    <div className="rounded-xl border border-border-default bg-surface-primary p-6">
      <h2 className="mb-6 text-body font-semibold uppercase tracking-wider text-content-primary">
        Two-Factor Authentication
      </h2>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {mfaEnabled ? (
            <ShieldCheck size={20} className="text-success" />
          ) : (
            <Shield size={20} className="text-content-tertiary" />
          )}
          <div>
            <p className="text-body font-normal text-content-primary">
              {mfaEnabled ? "MFA is enabled" : "MFA is not enabled"}
            </p>
            <p className="text-caption text-content-secondary">
              {mfaEnabled
                ? `${status?.recoveryCodesRemaining ?? "?"} recovery codes remaining`
                : "Add an extra layer of security to your account"}
            </p>
          </div>
        </div>

        {error && (
          <p
            className="text-caption text-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {mfaEnabled ? (
            <>
              <Button
                variant="outline"
                size="md"
                fullWidth={false}
                onClick={() => {
                  setError("");
                  setView("regenerate");
                }}
              >
                <RefreshCw size={16} />
                Regenerate Codes
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth={false}
                onClick={() => {
                  setError("");
                  setView("disable");
                }}
              >
                <ShieldOff size={16} />
                Disable MFA
              </Button>
            </>
          ) : (
            <Button
              size="md"
              fullWidth={false}
              loading={loading}
              onClick={handleSetup}
            >
              <Shield size={16} />
              Enable MFA
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
