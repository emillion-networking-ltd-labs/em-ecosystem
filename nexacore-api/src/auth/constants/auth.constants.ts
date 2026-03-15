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
};

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

/** HMAC derivation label for device fingerprint secret. */
export const DEVICE_FINGERPRINT_HMAC_LABEL = 'device-fingerprint-key';

/** HTTP header name for device fingerprint (lowercase for req.headers lookup). */
export const DEVICE_FINGERPRINT_HEADER = 'x-device-fingerprint';

/** Cookie name for refresh tokens. */
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

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
