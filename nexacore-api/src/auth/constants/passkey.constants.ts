/** Redis key prefix for registration challenges. Format: webauthn:reg:{userId} */
export const WEBAUTHN_REG_KEY_PREFIX = 'webauthn:reg:';

/** Redis key prefix for authentication challenges. Format: webauthn:auth:{challengeId} */
export const WEBAUTHN_AUTH_KEY_PREFIX = 'webauthn:auth:';

/** Challenge TTL in seconds (5 minutes). */
export const WEBAUTHN_CHALLENGE_TTL_SECONDS = 300;

/** Maximum passkeys per user. */
export const MAX_PASSKEYS_PER_USER = 10;

/** Default passkey display name when none provided. */
export const DEFAULT_PASSKEY_NAME = 'Passkey';
