"use client";

import { useAuth } from "@/hooks/useAuth";
import LoginFormV2 from "./LoginFormV2";
import MfaTotpStepV2 from "./MfaTotpStepV2";
import TenantPickStep from "./TenantPickStep";

/**
 * AuthIntentFlow — top-level orchestrator for the v2 login flow.
 *
 * SCRUM-499 / AUTH v2 Phase 2.3 — plan decision F.
 *
 * Reads `authIntentStatus` from AuthContext and conditionally renders the
 * appropriate step:
 *   - null OR 'requires_credentials' → <LoginFormV2 />
 *   - 'requires_mfa' → <MfaTotpStepV2 />
 *   - 'requires_tenant_pick' → <TenantPickStep />
 *   - 'succeeded' → null (AuthContext's AUTH_SUCCESS triggers existing
 *      redirect machinery via GuestRoute/route effects)
 *   - 'failed' / 'expired' / 'requires_passkey' / 'requires_setup' →
 *      defensive <LoginFormV2 /> (errors surface via toasts handled in
 *      AuthContext)
 *
 * Single source of truth = AuthContext state. No direct API calls here.
 */
export default function AuthIntentFlow() {
  const { authIntentStatus } = useAuth();

  switch (authIntentStatus) {
    case "requires_mfa":
      return <MfaTotpStepV2 />;
    case "requires_tenant_pick":
      return <TenantPickStep />;
    case "succeeded":
      // GuestRoute + the AUTH_SUCCESS effect in AuthContext handle the redirect.
      return null;
    case "requires_credentials":
    case "failed":
    case "expired":
    case "requires_passkey":
    case "requires_setup":
    case null:
    default:
      return <LoginFormV2 />;
  }
}
