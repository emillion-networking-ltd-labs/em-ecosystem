import { registerAs } from '@nestjs/config';

export const oauthConfig = registerAs('oauth', () => ({
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/auth/google/callback',
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubCallbackUrl:
    process.env.GITHUB_CALLBACK_URL ||
    'http://localhost:3000/auth/github/callback',
}));

export type OAuthConfig = ReturnType<typeof oauthConfig>;
