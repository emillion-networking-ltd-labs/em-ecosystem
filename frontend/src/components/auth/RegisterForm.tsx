"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "./ErrorAlert";
import { PasswordStrength, isPasswordValid } from "./PasswordStrength";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const { register, isLoading, error, clearError } = useAuth();

  const passwordValid = isPasswordValid(password);
  const canSubmit =
    email && passwordValid && password === confirmPassword && !isLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }
    setConfirmError("");
    await register(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={clearError} />}
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <div>
        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <PasswordStrength password={password} />
      </div>
      <Input
        label="Confirm password"
        type="password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setConfirmError("");
        }}
        error={confirmError}
        required
        autoComplete="new-password"
      />
      <Button type="submit" loading={isLoading} disabled={!canSubmit}>
        Create account
      </Button>
    </form>
  );
}
