/** Must match backend DTOs: @MinLength(8) in register.dto.ts, reset-password.dto.ts */
export const PASSWORD_MIN_LENGTH = 8;
/** Must match backend DTOs: @MaxLength(128) in register.dto.ts, reset-password.dto.ts */
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Validate password against backend DTO rules.
 * Returns an error message string, or null if valid.
 */
export function validatePassword(password: string): string | null {
  if (!password) return "Enter your password";
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (password.length > PASSWORD_MAX_LENGTH)
    return `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`;
  return null;
}

/**
 * Single source of truth for email validation across the dashboard.
 * Must match backend behavior (`class-validator` `@IsEmail()` defaults).
 * FE-25: previously 4 components had inline regex variants (some required 2+ char TLDs).
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
