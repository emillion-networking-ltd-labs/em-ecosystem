import * as bcrypt from 'bcrypt';

/**
 * Bcrypt hash rounds for password hashing.
 */
export const BCRYPT_ROUNDS = 12;

/**
 * Maximum failed login attempts before account lockout.
 */
export const MAX_FAILED_ATTEMPTS = 5;

/**
 * Pre-computed dummy bcrypt hash for timing attack protection.
 * Used when user is not found to ensure constant-time response.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  'dummy-password-for-timing-protection',
  BCRYPT_ROUNDS,
);

/**
 * Minimum login response duration in milliseconds.
 * Mitigates timing attacks by ensuring all login paths (success, MFA required, MFA setup, lockout, failures)
 * take at least this long to respond. If execution completes faster, setTimeout pads the response.
 * 350ms is conservative above typical bcrypt 12-round time (~200–300ms).
 * Addresses audit findings H-12 (account lockout timing leak) and EM-04 (login path timing variance).
 */
export const MIN_LOGIN_DURATION_MS = 350;

/**
 * Lockout duration escalation in minutes.
 * Index = lockoutCount (0-based), value = minutes locked.
 * After the last index, the final value is used for all subsequent lockouts.
 */
export const LOCKOUT_DURATIONS_MINUTES = [15, 30, 60, 120];

/**
 * Calculate lockout duration in milliseconds based on lockoutCount.
 */
export function getLockoutDurationMs(lockoutCount: number): number {
  const index = Math.min(lockoutCount, LOCKOUT_DURATIONS_MINUTES.length - 1);
  return LOCKOUT_DURATIONS_MINUTES[index] * 60 * 1000;
}

/**
 * Calculate lockout duration in minutes based on lockoutCount.
 */
export function getLockoutDurationMinutes(lockoutCount: number): number {
  const index = Math.min(lockoutCount, LOCKOUT_DURATIONS_MINUTES.length - 1);
  return LOCKOUT_DURATIONS_MINUTES[index];
}

/**
 * Global rate limit configuration.
 */
export const GLOBAL_RATE_LIMIT = {
  ttl: 60_000, // 60 seconds in milliseconds
  limit: 100,
};

/**
 * Per-endpoint rate limit configurations.
 * Login: 10/60s — strict IP throttle; account lockout (5 wrong passwords →
 * escalating lockout) provides additional per-account brute-force protection.
 * The frontend differentiates 429 (IP throttle) from 403 (account lockout).
 * MFA: 5/60s — strict; limits TOTP brute-force (6-digit = 1M combinations).
 * Combined with 5-minute mfaToken expiry, attacker gets max 25 guesses per challenge.
 */
export const AUTH_RATE_LIMITS = {
  login: { ttl: 60_000, limit: 10 },
  register: { ttl: 60_000, limit: 5 },
  refresh: { ttl: 60_000, limit: 30 },
  oauth: { ttl: 60_000, limit: 10 },
  mfa: { ttl: 60_000, limit: 5 },
  verify_email: { ttl: 60_000, limit: 10 },
  reset_password: { ttl: 60_000, limit: 5 },
  trust_device: { ttl: 60_000, limit: 5 },
  sensitive_action: { ttl: 900_000, limit: 3 }, // 15 min, 3 req (email resend, password reset)
  user_settings: { ttl: 60_000, limit: 5 }, // 60s, 5 req (email change, oauth unlink)
};

/**
 * Pre-shaped @Throttle({ global: ... }) configs.
 *
 * SCRUM-356 / DU-04: extracts the repeated `@Throttle({ global: { ttl, limit } })`
 * decorator stacks that previously appeared in mfa.controller (4×), passkey.controller,
 * and account.controller. Centralizing here means a rate-limit change touches one place
 * and the @Throttle callsites become a single line each.
 */
export const THROTTLE_CONFIGS = {
  mfa: { global: AUTH_RATE_LIMITS.mfa },
  sensitiveAction: { global: AUTH_RATE_LIMITS.sensitive_action },
  userSettings: { global: AUTH_RATE_LIMITS.user_settings },
  trustDevice: { global: AUTH_RATE_LIMITS.trust_device },
  oauth: { global: AUTH_RATE_LIMITS.oauth },
} as const;

/**
 * Session idle timeout in hours.
 * Sessions with lastUsedAt older than this are rejected on refresh.
 * NIST SP 800-63B §7.2 / OWASP ASVS V3.3.2: idle timeout <= 30 min at AAL2.
 * Default: 0.5h (30 minutes). Configurable via ConfigService 'auth.sessionIdleTimeoutHours'.
 */
export const SESSION_IDLE_TIMEOUT_HOURS = 0.5;

/**
 * Maximum concurrent active (non-idle, non-revoked, non-expired) sessions per user.
 * Oldest evicted on overflow.
 * Configurable via ConfigService 'auth.maxConcurrentSessions'.
 */
export const MAX_CONCURRENT_SESSIONS = 5;

/**
 * Trusted device TTL in days.
 * After this period, the device must re-verify via MFA.
 * Configurable via ConfigService 'auth.trustedDeviceTtlDays'.
 */
export const TRUSTED_DEVICE_TTL_DAYS = 30;

/**
 * Maximum trusted devices per user.
 * Oldest revoked when exceeded.
 */
export const MAX_TRUSTED_DEVICES_PER_USER = 10;

/** HMAC derivation label for MFA challenge token secret. */
export const MFA_CHALLENGE_HMAC_LABEL = 'mfa-challenge-token';

/** JWT payload type for MFA challenge tokens. */
export const MFA_CHALLENGE_TOKEN_TYPE = 'mfa-challenge';

/** MFA challenge token expiry duration. */
export const MFA_CHALLENGE_EXPIRY = '5m';

/** HMAC derivation label for MFA setup token secret. */
export const MFA_SETUP_HMAC_LABEL = 'mfa-setup-token';

/** JWT payload type for MFA setup tokens (scoped: only /auth/mfa/setup & verify-setup). */
export const MFA_SETUP_TOKEN_TYPE = 'mfa-setup';

/** MFA setup token expiry duration. */
export const MFA_SETUP_EXPIRY = '10m';

/** HMAC derivation label for device fingerprint secret. */
export const DEVICE_FINGERPRINT_HMAC_LABEL = 'device-fingerprint-key';

/** HTTP header name for device fingerprint (lowercase for req.headers lookup). */
export const DEVICE_FINGERPRINT_HEADER = 'x-device-fingerprint';

/** Cookie name for refresh tokens. */
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

/** OAuth code cookie max age in milliseconds (30 seconds). */
export const OAUTH_CODE_COOKIE_MAX_AGE_MS = 30_000;

/** JWT issuer and audience identifier. */
export const JWT_ISSUER = 'nexacore-api';
export const JWT_AUDIENCE = 'nexacore-api';

/** Access token TTL in seconds (15 minutes). Used for deny-list expiry. */
export const ACCESS_TOKEN_TTL_SECONDS = 900;

/** Email verification token expiry in hours. */
export const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

/** Minimum seconds between resend-verification requests. */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Password reset token expiry in hours. */
export const RESET_TOKEN_EXPIRY_HOURS = 1;

/** Bcrypt rounds for MFA recovery code hashing (lower than password for UX). */
export const BCRYPT_ROUNDS_RECOVERY = 10;

/** Number of MFA recovery codes generated per setup. */
export const RECOVERY_CODE_COUNT = 10;

/** Character length of each MFA recovery code. */
export const RECOVERY_CODE_LENGTH = 10;

/** Convert hours to milliseconds. */
export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/** Convert days to milliseconds. */
export function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}
