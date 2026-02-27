'use client';

import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import InfinitySpinner from '@/components/ui/InfinitySpinner';
import { useAuth } from '@/hooks/useAuth';

export default function MfaTotpStep() {
  const { verifyMfaLogin, cancelMfa, isLoading, error, clearError } = useAuth();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!useRecovery) {
      inputRefs.current[0]?.focus();
    }
  }, [useRecovery]);

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
      const full = updated.join('');
      if (full.length === 6) {
        verifyMfaLogin(full, false);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setCode(updated);

    if (pasted.length === 6) {
      verifyMfaLogin(pasted, false);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    verifyMfaLogin(recoveryCode.trim(), true);
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full = code.join('');
    if (full.length !== 6) return;
    verifyMfaLogin(full, false);
  };

  if (useRecovery) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
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
              <label className="text-[15px] font-semibold leading-[22px] text-content-primary">
                Recovery Code
              </label>
              <div className="flex h-12 items-center rounded-lg border border-border-default bg-transparent px-4 outline outline-2 outline-offset-2 outline-transparent transition-colors focus-within:outline-content-primary/75">
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => { clearError(); setRecoveryCode(e.target.value); }}
                  placeholder="xxxx-xxxx-xxxx"
                  className="flex-1 bg-transparent font-mono text-[15px] leading-6 text-content-primary outline-none placeholder:text-content-placeholder"
                  autoFocus
                />
              </div>

              <div className={`flex items-center gap-2 ${error ? 'min-h-6' : 'h-6'}`}>
                {error && (
                  <>
                    <AlertTriangle size={16} className="shrink-0 text-error" />
                    <span className="flex-1 text-xs leading-6 text-error">{error}</span>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !recoveryCode.trim()}
              className="relative flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className={isLoading ? 'opacity-30' : ''}>Verify</span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => { clearError(); setUseRecovery(false); setRecoveryCode(''); }}
                className="flex items-center gap-1 text-sm font-medium text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
              >
                <ArrowLeft size={14} />
                Use authenticator app
              </button>
              <button
                type="button"
                onClick={cancelMfa}
                className="text-sm font-medium text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Two-Factor Authentication
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
            Enter the 6-digit code from your authenticator app to complete sign in.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[348px]">
        <form onSubmit={handleTotpSubmit} className="flex flex-col gap-2">
          <div className="flex min-h-[116px] flex-col gap-2">
            <label className="text-[15px] font-semibold leading-[22px] text-content-primary">
              Verification Code
            </label>

            {/* 6-digit code input */}
            <div className="flex gap-2" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 w-12 rounded-lg border border-border-default bg-transparent text-center font-mono text-lg text-content-primary outline outline-2 outline-offset-2 outline-transparent transition-colors focus:outline-content-primary/75"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            <div className={`flex items-center gap-2 ${error ? 'min-h-6' : 'h-6'}`}>
              {error && (
                <>
                  <AlertTriangle size={16} className="shrink-0 text-error" />
                  <span className="flex-1 text-xs leading-6 text-error">{error}</span>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || code.join('').length !== 6}
            className="relative flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className={isLoading ? 'opacity-30' : ''}>Verify</span>
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <InfinitySpinner />
              </span>
            )}
          </button>

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { clearError(); setUseRecovery(true); setCode(Array(6).fill('')); }}
              className="text-sm font-medium text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
            >
              Use recovery code
            </button>
            <button
              type="button"
              onClick={cancelMfa}
              className="text-sm font-medium text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
