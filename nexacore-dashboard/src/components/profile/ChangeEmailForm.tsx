"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { PROFILE_TOAST } from "@/lib/toast-messages";
import { requestEmailChange } from "@/lib/email-change-api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Info } from "lucide-react";
import { extractMessageByStatus } from "@/lib/error-utils";
import { HTTP_STATUS } from "@/lib/error-constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailForm() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const isOAuthOnly = user.oauthProviders.length > 0 && !user.hasPassword;
  const providerNames = user.oauthProviders
    .map((p) => (p === "GOOGLE" ? "Google" : p === "GITHUB" ? "GitHub" : p))
    .join(" and ");

  const isValidEmail = EMAIL_REGEX.test(newEmail);
  const isSameEmail = newEmail.toLowerCase() === user.email.toLowerCase();
  const isValidPassword = password.length >= 8;
  const canSubmit =
    !isOAuthOnly && isValidEmail && !isSameEmail && isValidPassword && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOAuthOnly) return;
    setLoading(true);
    try {
      await requestEmailChange(newEmail, password);
      addToast(PROFILE_TOAST.VERIFICATION_EMAIL_SENT(newEmail));
      setNewEmail("");
      setPassword("");
    } catch (err: unknown) {
      const msg = extractMessageByStatus(
        err,
        {
          [HTTP_STATUS.TOO_MANY_REQUESTS]:
            "Too many requests. Try again later.",
        },
        "Failed to request email change.",
      );
      addToast(PROFILE_TOAST.EMAIL_CHANGE_FAILED(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="change-email"
      className="rounded-xl border border-border-strong bg-surface-primary p-6"
    >
      <h2 className="mb-6 text-body font-semibold uppercase tracking-wider text-content-primary">
        Change Email
      </h2>

      {isOAuthOnly ? (
        <div className="flex items-start gap-3 rounded-xl bg-surface-subtle p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-content-secondary" />
          <p className="text-body text-content-secondary">
            Your email is managed by {providerNames}. Set a password in{" "}
            <a
              href="#connected-accounts"
              className="font-normal text-content-primary underline underline-offset-2 hover:text-brand"
            >
              Connected Accounts
            </a>{" "}
            to change your email.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="New Email"
            name="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email address"
            error={
              newEmail && !isValidEmail
                ? "Enter a valid email address"
                : newEmail && isSameEmail
                  ? "New email must be different from current email"
                  : undefined
            }
          />

          <Input
            label="Current Password"
            name="emailChangePassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              size="md"
              fullWidth={false}
              loading={loading}
              disabled={!canSubmit}
            >
              Change Email
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
