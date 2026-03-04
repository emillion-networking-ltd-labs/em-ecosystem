/** Parse a duration string like '15m' or '1h' into milliseconds. Returns null if invalid. */
function parseDurationToMs(duration: string): number | null {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

/**
 * Validates that all security-critical secrets are properly configured
 * for production environments. Throws a fatal error if any secret is
 * missing, set to its development default, or shorter than 32 characters.
 *
 * Must be called before NestFactory.create() to prevent the application
 * from starting with insecure configuration.
 */
export function validateProductionSecrets(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const defaultJwt = 'default-dev-secret-change-in-production';
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === defaultJwt ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      'FATAL: JWT_SECRET must be set to a non-default value of at least 32 characters in production',
    );
  }

  const defaultMfa = 'dev-mfa-key-change-in-production-32ch';
  if (
    !process.env.MFA_ENCRYPTION_KEY ||
    process.env.MFA_ENCRYPTION_KEY === defaultMfa ||
    process.env.MFA_ENCRYPTION_KEY.length < 32
  ) {
    throw new Error(
      'FATAL: MFA_ENCRYPTION_KEY must be set to a non-default value of at least 32 characters in production',
    );
  }

  const defaultCsrf = 'dev-csrf-secret-change-in-production-min32chars';
  if (
    !process.env.CSRF_SECRET ||
    process.env.CSRF_SECRET === defaultCsrf ||
    process.env.CSRF_SECRET.length < 32
  ) {
    throw new Error(
      'FATAL: CSRF_SECRET must be set to a non-default value of at least 32 characters in production',
    );
  }

  // RFC 9700 §2.1: OAuth callback URLs must use HTTPS in production
  if (
    process.env.GOOGLE_CALLBACK_URL &&
    !process.env.GOOGLE_CALLBACK_URL.startsWith('https://')
  ) {
    throw new Error(
      'FATAL: GOOGLE_CALLBACK_URL must use HTTPS in production (RFC 9700)',
    );
  }

  if (
    process.env.GITHUB_CALLBACK_URL &&
    !process.env.GITHUB_CALLBACK_URL.startsWith('https://')
  ) {
    throw new Error(
      'FATAL: GITHUB_CALLBACK_URL must use HTTPS in production (RFC 9700)',
    );
  }

  // RFC 8725 §3.9: JWT access token expiry must not exceed 15 minutes
  const MAX_ACCESS_TOKEN_MS = 15 * 60 * 1000;
  const jwtExpiry = process.env.JWT_ACCESS_EXPIRATION;
  if (jwtExpiry) {
    const expiryMs = parseDurationToMs(jwtExpiry);
    if (expiryMs === null || expiryMs > MAX_ACCESS_TOKEN_MS) {
      throw new Error(
        'FATAL: JWT_ACCESS_EXPIRATION must be <= 15 minutes in production (RFC 8725)',
      );
    }
  }
}
