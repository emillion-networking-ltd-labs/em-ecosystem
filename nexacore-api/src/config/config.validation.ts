import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().default('http://localhost:3001'),
  OAUTH_ALLOWED_REDIRECT_URLS: Joi.string().optional().allow('').default(''),

  // JWT
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required':
      'JWT_SECRET is required. Set a strong secret (min 32 chars).',
    'string.min': 'JWT_SECRET must be at least 32 characters.',
  }),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('12h'),

  // Session
  SESSION_IDLE_TIMEOUT_HOURS: Joi.number().default(0.5),
  MAX_CONCURRENT_SESSIONS: Joi.number().integer().default(5),
  TRUSTED_DEVICE_TTL_DAYS: Joi.number().integer().default(30),

  // OAuth (required in production, optional in dev/test)
  GOOGLE_CLIENT_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().allow('').default(''),
  }),
  GOOGLE_CLIENT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().allow('').default(''),
  }),
  GOOGLE_CALLBACK_URL: Joi.string().default(
    'http://localhost:3000/auth/google/callback',
  ),
  GITHUB_CLIENT_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().allow('').default(''),
  }),
  GITHUB_CLIENT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional().allow('').default(''),
  }),
  GITHUB_CALLBACK_URL: Joi.string().default(
    'http://localhost:3000/auth/github/callback',
  ),

  // MFA / WebAuthn
  MFA_APP_NAME: Joi.string().default('EM NexaCore'),
  WEBAUTHN_RP_ID: Joi.string().default('localhost'),
  WEBAUTHN_RP_NAME: Joi.string().default('EM NexaCore'),
  WEBAUTHN_ORIGIN: Joi.string().default('http://localhost:3001'),
}).options({ allowUnknown: true });
