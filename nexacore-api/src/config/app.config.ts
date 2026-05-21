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
}));

export type AppConfig = ReturnType<typeof appConfig>;
