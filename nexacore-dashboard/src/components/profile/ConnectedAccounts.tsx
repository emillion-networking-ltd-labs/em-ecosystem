"use client";

import { useState, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { unlinkOAuth, generateLinkCode } from "@/lib/oauth-api";
import Input from "@/components/ui/Input";
import Tooltip from "@/components/ui/Tooltip";
import { extractMessageByStatus } from "@/lib/error-utils";
import { HTTP_STATUS } from "@/lib/error-constants";

const providers = [
  {
    id: "GOOGLE" as const,
    name: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    id: "GITHUB" as const,
    name: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-content-primary">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
];

export default function ConnectedAccounts() {
  const { user, refreshSession } = useAuth();
  const { addToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [disconnectingProvider, setDisconnectingProvider] = useState<
    string | null
  >(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm = password.length >= 8 && !loading;

  const handleClose = () => {
    if (loading) return;
    setDisconnectingProvider(null);
    setPassword("");
  };

  const handleUnlink = async () => {
    if (!disconnectingProvider) return;
    setLoading(true);
    try {
      await unlinkOAuth(disconnectingProvider, password);
      const providerName =
        providers.find((p) => p.id === disconnectingProvider)?.name ??
        disconnectingProvider;
      setDisconnectingProvider(null);
      setPassword("");
      addToast({
        variant: "success",
        title: "Account disconnected",
        description: `${providerName} has been disconnected.`,
      });
      await refreshSession();
    } catch (err: unknown) {
      const msg = extractMessageByStatus(
        err,
        {
          [HTTP_STATUS.TOO_MANY_REQUESTS]:
            "Too many requests. Try again later.",
          [HTTP_STATUS.UNAUTHORIZED]: "Invalid password.",
        },
        "Failed to unlink OAuth provider.",
      );
      addToast({
        variant: "error",
        title: "Disconnect failed",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!disconnectingProvider) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  if (!user) return null;

  const [connecting, setConnecting] = useState(false);

  const handleConnect = async (providerId: string) => {
    setConnecting(true);
    try {
      const { code } = await generateLinkCode();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      window.location.href = `${apiUrl}/auth/link/${providerId.toLowerCase()}?code=${encodeURIComponent(code)}`;
    } catch {
      addToast({
        variant: "error",
        title: "Connection failed",
        description: "Could not initiate account linking. Please try again.",
      });
      setConnecting(false);
    }
  };

  const activeProvider = providers.find((p) => p.id === disconnectingProvider);

  return (
    <>
      <div
        id="connected-accounts"
        className="rounded-2xl border border-border-default bg-surface-primary p-6 shadow-card"
      >
        <h2 className="mb-6 text-body-sm font-semibold uppercase tracking-wider text-content-primary">
          Connected Accounts
        </h2>

        <div className="space-y-3">
          {providers.map((provider) => {
            const isConnected = user.oauthProviders.includes(provider.id);
            const isLastAuthMethod =
              !user.hasPassword && user.oauthProviders.length === 1;

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between rounded-xl border border-border-default p-4"
              >
                <div className="flex items-center gap-3">
                  {provider.icon}
                  <span className="text-body-sm font-medium text-content-primary">
                    {provider.name}
                  </span>
                </div>

                {isConnected ? (
                  isLastAuthMethod ? (
                    <span className="text-caption text-content-tertiary">
                      Set a password first
                    </span>
                  ) : (
                    <button
                      onClick={() => setDisconnectingProvider(provider.id)}
                      className="rounded-md border border-error-border px-4 py-1.5 text-caption text-error hover:bg-error-bg"
                    >
                      Disconnect
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConnect(provider.id)}
                      disabled={connecting}
                      className="rounded-md border border-border-default px-4 py-1.5 text-caption text-content-primary hover:bg-surface-subtle disabled:opacity-50"
                    >
                      {connecting ? "Connecting..." : "Connect"}
                    </button>
                    {provider.id === "GITHUB" && (
                      <Tooltip
                        content="Your active GitHub session will be used. To link a different account, log out of github.com first."
                        position="left"
                      >
                        <Info
                          className="h-4 w-4 text-content-tertiary cursor-help"
                          tabIndex={0}
                        />
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Disconnect confirmation modal */}
      {disconnectingProvider && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === overlayRef.current) handleClose();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="disconnect-title"
            className="w-[427px] overflow-hidden rounded-3xl border border-border-default bg-surface-secondary shadow-card"
          >
            {/* Top section */}
            <div className="border-b border-border-default bg-surface-primary p-6">
              <h2
                id="disconnect-title"
                className="text-heading-md text-content-primary"
              >
                Disconnect {activeProvider?.name}
              </h2>
              <p className="mt-2 text-body-sm text-content-secondary">
                This provider will be removed from your account. You can
                reconnect it later.
              </p>

              <div className="mt-4">
                <Input
                  label="Password"
                  name="unlinkPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Bottom section — buttons */}
            <div className="flex justify-end gap-3 p-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="h-10 rounded-md px-6 text-body-sm font-medium tracking-[-0.28px] text-content-secondary transition-colors hover:bg-surface-subtle disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlink}
                disabled={!canConfirm}
                className="h-10 rounded-md px-6 text-body-sm font-medium tracking-[-0.28px] bg-error text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
