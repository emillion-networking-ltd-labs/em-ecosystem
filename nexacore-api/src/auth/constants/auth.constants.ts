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
};

/**
 * Session idle timeout in hours.
 * Sessions with lastUsedAt older than this are rejected on refresh.
 */
export const SESSION_IDLE_TIMEOUT_HOURS = parseInt(
  process.env.SESSION_IDLE_TIMEOUT_HOURS || '24',
  10,
);

/**
 * Maximum concurrent active (non-idle, non-revoked, non-expired) sessions per user.
 * Oldest evicted on overflow.
 */
export const MAX_CONCURRENT_SESSIONS = parseInt(
  process.env.MAX_CONCURRENT_SESSIONS || '5',
  10,
);

/**
 * Trusted device TTL in days.
 * After this period, the device must re-verify via MFA.
 */
export const TRUSTED_DEVICE_TTL_DAYS = parseInt(
  process.env.TRUSTED_DEVICE_TTL_DAYS || '30',
  10,
);

/**
 * Maximum trusted devices per user.
 * Oldest revoked when exceeded.
 */
export const MAX_TRUSTED_DEVICES_PER_USER = 10;
