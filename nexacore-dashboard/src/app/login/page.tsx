import { Suspense } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import AuthIntentFlow from "@/components/auth/v2/AuthIntentFlow";
import GuestRoute from "@/components/guards/GuestRoute";
import { AUTH_INTENT_V2_ENABLED } from "@/lib/constants";

export const metadata = {
  title: "Sign In — EM NexaCore",
};

export default function LoginPage() {
  return (
    <GuestRoute>
      <AuthLayout>
        <Suspense>
          {/* SCRUM-499 / AUTH v2 Phase 2.3 — env-baked flag chooses v1 (default
              prod) vs v2 AuthIntent flow. NEXT_PUBLIC_* is inlined at build
              time, so no client/server hydration mismatch. */}
          {AUTH_INTENT_V2_ENABLED ? <AuthIntentFlow /> : <LoginForm />}
        </Suspense>
      </AuthLayout>
    </GuestRoute>
  );
}
