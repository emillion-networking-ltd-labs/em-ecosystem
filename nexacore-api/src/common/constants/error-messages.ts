export const ErrorMessages = {
  auth: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    AUTHENTICATION_FAILED: 'Authentication failed',
    REGISTRATION_FAILED: 'Unable to complete registration',
    UNABLE_TO_COMPLETE: 'Unable to complete request',
    CHECK_EMAIL: 'Please check your email to continue',
    TOO_MANY_ATTEMPTS: 'Too many attempts. Please try again later.',
    INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
    TOKEN_REVOKED: 'Authentication failed',
    INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  },
  mfa: {
    OPERATION_NOT_AVAILABLE: 'MFA operation not available',
    INVALID_CODE: 'Invalid verification code',
    INVALID_TOKEN: 'Invalid or expired MFA token',
    AUTHENTICATION_REQUIRED: 'Authentication required',
  },
  session: {
    NOT_FOUND: 'Session not found',
  },
  user: {
    NOT_FOUND: 'User not found',
    INVALID_PASSWORD: 'Invalid password',
    PASSWORD_REQUIRED: 'Current password is required',
    OPERATION_NOT_PERMITTED: 'Operation not permitted',
  },
  permission: {
    ACCESS_DENIED: 'Access denied',
    INVALID_ROLE_OPERATION: 'Invalid role for this operation',
  },
  oauth: {
    LINK_FAILED: 'Unable to link this provider',
    NOT_LINKED: 'No OAuth provider linked to this account',
    PASSWORD_REQUIRED_FOR_UNLINK:
      'You must set a password before unlinking your OAuth provider',
    INVALID_PROVIDER: 'Invalid OAuth provider',
    EMAIL_MISMATCH: 'OAuth account email must match your account email',
  },
  passkey: {
    NOT_FOUND: 'Passkey not found',
  },
  device: {
    NOT_FOUND: 'Device not found',
  },
  audit: {
    NOT_FOUND: 'Audit log not found',
  },
  security: {
    VERIFICATION_REQUIRED: 'Verification required',
    VERIFICATION_FAILED: 'Verification failed. Please try again.',
  },
  csrf: {
    VALIDATION_FAILED: 'CSRF validation failed',
  },
  validation: {
    FAILED: 'Validation failed',
  },
} as const;
