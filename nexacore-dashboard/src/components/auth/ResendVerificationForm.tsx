"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import CountdownTimer from "@/components/ui/CountdownTimer";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

const COOLDOWN_SECONDS = 60;

export default function ResendVerificationForm() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { resendVerificationPublic } = useAuth();

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || cooldown > 0) return;

      setIsLoading(true);
      await resendVerificationPublic(email.trim(), turnstileToken ?? undefined);
      setIsLoading(false);
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
      setTurnstileResetKey((k) => k + 1);
    },
    [email, cooldown, turnstileToken, resendVerificationPublic],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <Mail size={48} className="text-content-primary/50" strokeWidth={1.5} />

      <div className="flex flex-col items-center gap-1">
        <h2 className="text-h2 font-semibold text-content-primary">
          Resend Verification
        </h2>
        <p className="text-center text-caption text-content-primary/50">
          Enter your email address and we&apos;ll send a new verification link.
        </p>
      </div>

      {sent ? (
        <div className="flex w-full flex-col items-center gap-4">
          <p className="text-center text-body text-content-primary/75">
            If an account exists with this email, a verification link has been
            sent. Please check your inbox.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cooldown > 0}
              onClick={() => {
                setSent(false);
              }}
            >
              Send again
            </Button>
            {cooldown > 0 && <CountdownTimer seconds={cooldown} />}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />

          <TurnstileWidget
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            resetKey={turnstileResetKey}
          />

          <Button type="submit" disabled={isLoading || !email.trim()}>
            {isLoading ? "Sending..." : "Send Verification Email"}
          </Button>
        </form>
      )}

      <Button
        as={Link}
        href="/login"
        variant="link-underline"
        size="md"
        fullWidth={false}
      >
        Back to Sign In
      </Button>
    </div>
  );
}
