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

  // RFC 9700 §2.1: OAuth callback URLs must be HTTPS in production
  if (
    !process.env.GOOGLE_CALLBACK_URL ||
    !process.env.GOOGLE_CALLBACK_URL.startsWith('https://')
  ) {
    throw new Error(
      'FATAL: GOOGLE_CALLBACK_URL must be set to an HTTPS URL in production',
    );
  }
  if (
    !process.env.GITHUB_CALLBACK_URL ||
    !process.env.GITHUB_CALLBACK_URL.startsWith('https://')
  ) {
    throw new Error(
      'FATAL: GITHUB_CALLBACK_URL must be set to an HTTPS URL in production',
    );
  }

  // RFC 8725 §3.9: Access token expiry must not exceed 15 minutes in production
  const accessExp = process.env.JWT_ACCESS_EXPIRATION;
  if (accessExp) {
    const match = accessExp.match(/^(\d+)(m|h|d|s)$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      const minutes =
        unit === 's'
          ? value / 60
          : unit === 'm'
            ? value
            : unit === 'h'
              ? value * 60
              : value * 1440;
      if (minutes > 15) {
        throw new Error(
          'FATAL: JWT_ACCESS_EXPIRATION must not exceed 15 minutes in production (RFC 8725)',
        );
      }
    }
  }
}
