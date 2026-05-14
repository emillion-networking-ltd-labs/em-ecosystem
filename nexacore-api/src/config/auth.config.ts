import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '12h',
  sessionIdleTimeoutHours: parseFloat(
    process.env.SESSION_IDLE_TIMEOUT_HOURS || '0.5',
  ),
  maxConcurrentSessions: parseInt(
    process.env.MAX_CONCURRENT_SESSIONS || '5',
    10,
  ),
  trustedDeviceTtlDays: parseInt(
    process.env.TRUSTED_DEVICE_TTL_DAYS || '30',
    10,
  ),
  mfaAppName: process.env.MFA_APP_NAME || 'EM NexaCore',
  webauthnRpId: process.env.WEBAUTHN_RP_ID || 'localhost',
  webauthnRpName: process.env.WEBAUTHN_RP_NAME || 'EM NexaCore',
  webauthnOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3001',
}));

export type AuthConfig = ReturnType<typeof authConfig>;
