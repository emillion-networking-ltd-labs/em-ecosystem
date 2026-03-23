"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import InfinitySpinner from "@/components/ui/InfinitySpinner";
import RateLimitBanner from "@/components/ui/RateLimitBanner";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { RateLimitError } from "@/lib/types";

export default function MfaTotpStep() {
  const { verifyMfaLogin, cancelMfa, isLoading, error, clearError } = useAuth();
  const { rateLimitInfo, setRateLimit, clearRateLimit } = useRateLimit();
  const showRateLimit = rateLimitInfo.isRateLimited;
  const showError = !showRateLimit && !!error;
  const isDisabled = isLoading || rateLimitInfo.isRateLimited;
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!useRecovery) {
      inputRefs.current[0]?.focus();
    }
  }, [useRecovery]);

  const handleVerify = useCallback(
    async (codeStr: string, isRecovery: boolean) => {
      try {
        await verifyMfaLogin(codeStr, isRecovery, trustDevice);
      } catch (err) {
        if (err instanceof RateLimitError) {
          setRateLimit(err.retryAfter, err.message);
        }
      }
    },
    [verifyMfaLogin, setRateLimit, trustDevice],
  );

  const handleDigitChange = (index: number, value: string) => {
    clearError();
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1);
    const updated = [...code];
    updated[index] = digit;
    setCode(updated);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (digit && index === 5) {
      const full = updated.join("");
      if (full.length === 6) {
        handleVerify(full, false);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const updated = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setCode(updated);

    if (pasted.length === 6) {
      handleVerify(pasted, false);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    handleVerify(recoveryCode.trim(), true);
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full = code.join("");
    if (full.length !== 6) return;
    handleVerify(full, false);
  };

  if (useRecovery) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col gap-2 md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
              Recovery Code
            </h1>
            <p className="text-justify text-sm leading-[21px] text-content-primary/50">
              Enter one of your recovery codes. Each code can only be used once.
            </p>
          </div>
        </div>

        <div className="w-full md:w-[348px]">
          <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-2">
            <div className="flex min-h-[116px] flex-col gap-2">
              <label
                htmlFor="recovery-code"
                className="text-[15px] font-semibold leading-[22px] text-content-primary"
              >
                Recovery Code
              </label>
              <div className="flex h-12 items-center rounded-lg border border-border-strong bg-transparent px-4 outline outline-2 outline-offset-2 outline-transparent transition-colors focus-within:outline-content-primary/75">
                <input
                  id="recovery-code"
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => {
                    clearError();
                    setRecoveryCode(e.target.value);
                  }}
                  placeholder="xxxx-xxxx-xxxx"
                  className="flex-1 bg-transparent font-mono text-[15px] leading-6 text-content-primary outline-none placeholder:text-content-placeholder"
                  autoFocus
                />
              </div>

              {showRateLimit ? (
                <RateLimitBanner
                  retryAfter={rateLimitInfo.retryAfter!}
                  message={rateLimitInfo.message!}
                  onExpired={clearRateLimit}
                />
              ) : (
                <div
                  role="alert"
                  aria-live="polite"
                  className={`flex items-center gap-2 ${showError ? "min-h-6" : "h-6"}`}
                >
                  {showError && (
                    <>
                      <AlertTriangle
                        size={16}
                        className="shrink-0 text-error"
                      />
                      <span className="flex-1 text-xs leading-6 text-error">
                        {error}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Trust device checkbox */}
              <label
                htmlFor="trust-recovery"
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  id="trust-recovery"
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-border-strong accent-surface-inverse"
                />
                <span className="text-sm leading-[21px] text-content-primary/75">
                  Trust this device for 30 days
                </span>
              </label>

              {/* Back link — right-aligned, same position as Forgot password? in login */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    clearRateLimit();
                    setUseRecovery(false);
                    setRecoveryCode("");
                  }}
                  className="flex items-center gap-1 whitespace-nowrap text-sm font-normal leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
                >
                  <ArrowLeft size={14} />
                  Use authenticator app
                </button>
              </div>
            </div>

            {/* Buttons — Cancel (secondary) + Verify (primary) */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelMfa}
                className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-strong bg-transparent px-6 py-2.5 text-base font-normal text-content-primary transition-colors hover:bg-surface-subtle"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDisabled || !recoveryCode.trim()}
                className="relative flex h-10 flex-1 items-center justify-center rounded-md border border-border-strong bg-surface-inverse px-6 py-2.5 text-base font-normal text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
              >
                <span className={isLoading ? "opacity-30" : ""}>Verify</span>
                {isLoading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <InfinitySpinner />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Two-Factor Authentication
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
            Enter the 6-digit code from your authenticator app to complete sign
            in.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[348px]">
        <form onSubmit={handleTotpSubmit} className="flex flex-col gap-2">
          <div className="flex min-h-[116px] flex-col gap-2">
            <label
              htmlFor="totp-digit-0"
              className="text-[15px] font-semibold leading-[22px] text-content-primary"
            >
              Verification Code
            </label>

            {/* 6-digit code input */}
            <div
              className="flex gap-2"
              role="group"
              aria-label="Verification code digits"
              onPaste={handlePaste}
            >
              {code.map((digit, i) => (
                <input
                  key={i}
                  id={i === 0 ? "totp-digit-0" : undefined}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 w-12 rounded-lg border border-border-strong bg-transparent text-center font-mono text-lg text-content-primary outline outline-2 outline-offset-2 outline-transparent transition-colors focus:outline-content-primary/75"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {showRateLimit ? (
              <RateLimitBanner
                retryAfter={rateLimitInfo.retryAfter!}
                message={rateLimitInfo.message!}
                onExpired={clearRateLimit}
              />
            ) : (
              <div
                role="alert"
                aria-live="polite"
                className={`flex items-center gap-2 ${showError ? "min-h-6" : "h-6"}`}
              >
                {showError && (
                  <>
                    <AlertTriangle size={16} className="shrink-0 text-error" />
                    <span className="flex-1 text-xs leading-6 text-error">
                      {error}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Trust device checkbox */}
            <label
              htmlFor="trust-totp"
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                id="trust-totp"
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong accent-surface-inverse"
              />
              <span className="text-sm leading-[21px] text-content-primary/75">
                Trust this device for 30 days
              </span>
            </label>

            {/* Recovery link — right-aligned, same position as Forgot password? in login */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  clearRateLimit();
                  setUseRecovery(true);
                  setCode(Array(6).fill(""));
                }}
                className="whitespace-nowrap text-sm font-normal leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
              >
                Use recovery code
              </button>
            </div>
          </div>

          {/* Buttons — Cancel (secondary) + Verify (primary) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelMfa}
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-strong bg-transparent px-6 py-2.5 text-base font-normal text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDisabled || code.join("").length !== 6}
              className="relative flex h-10 flex-1 items-center justify-center rounded-md border border-border-strong bg-surface-inverse px-6 py-2.5 text-base font-normal text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className={isLoading ? "opacity-30" : ""}>Verify</span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
