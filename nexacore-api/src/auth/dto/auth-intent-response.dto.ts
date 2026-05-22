// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import { AuthIntentStatus } from '@prisma/client';

/**
 * AuthIntentResponseDto — response shape for `POST /auth/v2/intents` and
 * `POST /auth/v2/intents/:id/advance`.
 *
 * SCRUM-497 / AUTH v2 + Tenancy v1 Phase 2.2 (D-004).
 *
 * `accessToken` + `user` are present ONLY when `status === 'succeeded'`.
 * The refresh token is set as an httpOnly cookie (`refresh_token_v2`) by the
 * controller — never returned in this body (Phase 1.3 cookie posture).
 */
export interface AuthIntentResponseDto {
  id: string;
  status: AuthIntentStatus;
  /**
   * Hint to the client for what to send in the next advance call.
   * null at terminal states (succeeded, failed, expired).
   */
  nextStep: 'credentials' | 'mfa' | 'tenant_pick' | 'passkey' | null;
  expiresAt: Date;
  /** Present only when `status === 'succeeded'`. */
  accessToken?: string;
  /** Present only when `status === 'succeeded'`. */
  user?: {
    id: string;
    tenantId: string;
    tenantRole: string;
    isPlatformAdmin: boolean;
  };
  /**
   * Available tenant ids when `status === 'requires_tenant_pick'`.
   * UI uses this to render the tenant selector.
   */
  availableTenantIds?: string[];
}
