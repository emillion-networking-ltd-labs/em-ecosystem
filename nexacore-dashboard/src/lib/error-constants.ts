/**
 * Error detection constants — mirrors backend ErrorMessages substrings
 * used for frontend UI behavior branching.
 *
 * When the backend changes an error message, update the corresponding
 * constant here. All detection logic imports from this file.
 *
 * Source: nexacore-api/src/common/constants/error-messages.ts
 */

// --- String detection (used with message.toLowerCase().includes()) ---

/** Backend: ErrorMessages.csrf.VALIDATION_FAILED = 'CSRF validation failed' */
export const DETECTION_CSRF_ERROR = "csrf";

// --- HTTP status code constants ---
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOO_MANY_REQUESTS: 429,
} as const;

// --- Backend error.code values ---
export const ERROR_CODE = {
  FORBIDDEN: "FORBIDDEN",
} as const;
