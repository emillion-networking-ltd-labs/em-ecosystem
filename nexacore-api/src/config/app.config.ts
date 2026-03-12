import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  oauthAllowedRedirectUrls: process.env.OAUTH_ALLOWED_REDIRECT_URLS || '',
  isProduction: process.env.NODE_ENV === 'production',
}));

export type AppConfig = ReturnType<typeof appConfig>;
