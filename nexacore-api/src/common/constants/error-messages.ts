export const ErrorMessages = {
  auth: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    AUTHENTICATION_FAILED: 'Authentication failed',
    REGISTRATION_FAILED: 'Unable to complete registration',
    UNABLE_TO_COMPLETE: 'Unable to complete request',
    CHECK_EMAIL: 'Please check your email to continue',
    TOO_MANY_ATTEMPTS: 'Too many attempts. Please try again later.',
    INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
    INVALID_RESET_TOKEN: 'Invalid or expired reset token',
    PASSWORD_BREACHED:
      'This password has appeared in a data breach. Please choose a different password.',
    PASSWORD_MUST_DIFFER:
      'New password must be different from current password',
    EMAIL_ALREADY_VERIFIED: 'Email already verified',
    RESEND_COOLDOWN: 'Please wait before requesting another email',
    LOGIN_BLOCKED_SUSPICIOUS:
      'Login blocked due to suspicious location activity. Please try again later or contact support.',
  },
  mfa: {
    OPERATION_NOT_AVAILABLE: 'MFA operation not available',
    INVALID_CODE: 'Invalid verification code',
    INVALID_TOKEN: 'Invalid or expired MFA token',
    AUTHENTICATION_REQUIRED: 'Authentication required',
    PASSWORD_REQUIRED_NO_PASSWORD: 'Password confirmation required',
    SETUP_REQUIRED: 'MFA setup is required. Please enable MFA to continue.',
  },
  session: {
    NOT_FOUND: 'Resource not found',
  },
  user: {
    NOT_FOUND: 'Resource not found',
    INVALID_PASSWORD: 'Invalid password',
    PASSWORD_REQUIRED: 'Current password is required',
    OPERATION_NOT_PERMITTED: 'Operation not permitted',
    EMAIL_CHANGE_NOT_AVAILABLE: 'Email change not available for OAuth accounts',
    EMAIL_UNCHANGED: 'New email must be different from current email',
    PASSWORD_CONFIRMATION_REQUIRED:
      'Password confirmation required for local accounts',
    AVATAR_REQUIRED: 'Avatar file is required',
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
    NOT_FOUND: 'Resource not found',
    PASSWORD_REQUIRED_FOR_DELETE:
      'Password confirmation required to delete passkey',
    LIMIT_REACHED: 'Maximum number of passkeys reached',
    CHALLENGE_EXPIRED: 'Challenge not found or expired',
  },
  device: {
    NOT_FOUND: 'Resource not found',
  },
  audit: {
    NOT_FOUND: 'Resource not found',
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
