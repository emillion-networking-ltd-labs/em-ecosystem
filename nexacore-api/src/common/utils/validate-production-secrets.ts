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
}
