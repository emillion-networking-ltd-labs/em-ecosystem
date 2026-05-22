import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  oauthAllowedRedirectUrls: process.env.OAUTH_ALLOWED_REDIRECT_URLS || '',
  isProduction: process.env.NODE_ENV === 'production',
  /**
   * SCRUM-495 / Phase 2.1 (D-008): canonical subdomain used by platform admins
   * to access cross-tenant routes. Requests with `Host: <platformAdminSubdomain>.*`
   * skip the SubdomainTenantResolverMiddleware tenant binding and enter
   * `TenantContext.runWithBypass('platform-admin-route')` instead.
   */
  platformAdminSubdomain: process.env.PLATFORM_ADMIN_SUBDOMAIN || 'admin',
  /**
   * SCRUM-497 / Phase 2.2 (D-004): feature flag for the AuthIntent state machine.
   * When false, AuthIntentController endpoints return 404 (mimics "endpoint does
   * not exist"); when true, the v2 login orchestration is reachable. Default
   * false in production, true in CI/test env per plan decision D6.
   */
  authIntentV2Enabled: process.env.AUTH_INTENT_V2_ENABLED === 'true',
  /**
   * SCRUM-497 / Phase 2.2: TTL for AuthIntent rows in milliseconds.
   * 15 min default per plan decision D2; configurable via env for testing.
   */
  authIntentTtlMs: parseInt(process.env.AUTH_INTENT_TTL_MS || '900000', 10),
}));

export type AppConfig = ReturnType<typeof appConfig>;
