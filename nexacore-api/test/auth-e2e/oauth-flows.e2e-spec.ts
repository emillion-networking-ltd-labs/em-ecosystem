/**
 * OAuth Flows E2E Tests
 *
 * Flow 3: OAuth code exchange → tokens issued
 *
 * Note: Full OAuth redirect flows (Google/GitHub) cannot be tested E2E
 * because they require real OAuth providers. We test the exchange endpoint
 * which is the code path after the OAuth callback stores an ephemeral code.
 */
import request from 'supertest';
import { randomUUID } from 'crypto';
import type { App } from 'supertest/types';
import type { INestApplication } from '@nestjs/common';
import {
  createE2EApp,
  type E2EContext,
} from './setup';

jest.setTimeout(30_000);

describe('OAuth Flows (E2E)', () => {
  let ctx: E2EContext;
  let app: INestApplication<App>;

  beforeAll(async () => {
    ctx = await createE2EApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // FLOW 3: OAuth Code Exchange
  // ═══════════════════════════════════════════════════════════════════

  describe('Flow 3: OAuth code exchange', () => {
    it('3.1 — Exchange valid code returns access token + sets cookie', async () => {
      // Simulate what happens after OAuth callback: store ephemeral code in Redis
      const code = randomUUID();
      const mockPayload = {
        accessToken: 'mock-access-token-from-oauth',
        user: {
          id: randomUUID(),
          email: 'oauth-user@gmail.com',
          role: 'USER',
          emailVerified: true,
          mfaEnabled: false,
          firstName: null,
          lastName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        cookie: {
          name: 'refresh_token',
          value: 'mock-refresh-token-jwt',
          options: {
            httpOnly: true,
            secure: false,
            sameSite: 'strict' as const,
            path: '/',
            maxAge: 43200000,
          },
        },
      };

      // Store in mock Redis (same key pattern as OAuthCodeStore)
      await ctx.mockRedis.set(
        `oauth:code:${code}`,
        JSON.stringify(mockPayload),
        'EX',
        60,
      );

      const res = await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({ code })
        .expect(200);

      expect(res.body.accessToken).toBe('mock-access-token-from-oauth');
      expect(res.body.user.email).toBe('oauth-user@gmail.com');

      // Cookie should be set
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('3.2 — Exchange with invalid/expired code fails (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({ code: 'non-existent-code' })
        .expect(401);
    });

    it('3.3 — Code can only be exchanged once (single-use)', async () => {
      const code = randomUUID();
      const mockPayload = {
        accessToken: 'one-time-token',
        user: {
          id: randomUUID(),
          email: 'onetime@gmail.com',
          role: 'USER',
          emailVerified: true,
          mfaEnabled: false,
          firstName: null,
          lastName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        cookie: {
          name: 'refresh_token',
          value: 'one-time-refresh',
          options: {
            httpOnly: true,
            secure: false,
            sameSite: 'strict' as const,
            path: '/',
            maxAge: 43200000,
          },
        },
      };

      await ctx.mockRedis.set(
        `oauth:code:${code}`,
        JSON.stringify(mockPayload),
        'EX',
        60,
      );

      // First exchange succeeds
      await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({ code })
        .expect(200);

      // Second exchange fails — code consumed
      await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({ code })
        .expect(401);
    });

    it('3.4 — Exchange without code field fails (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({})
        .expect(400);
    });

    it('3.5 — OAuth exchange returns oauthAction for new accounts', async () => {
      const code = randomUUID();
      const mockPayload = {
        accessToken: 'created-token',
        user: {
          id: randomUUID(),
          email: 'new-oauth@gmail.com',
          role: 'USER',
          emailVerified: true,
          mfaEnabled: false,
          firstName: null,
          lastName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        cookie: {
          name: 'refresh_token',
          value: 'created-refresh',
          options: {
            httpOnly: true,
            secure: false,
            sameSite: 'strict' as const,
            path: '/',
            maxAge: 43200000,
          },
        },
        oauthAction: 'created',
      };

      await ctx.mockRedis.set(
        `oauth:code:${code}`,
        JSON.stringify(mockPayload),
        'EX',
        60,
      );

      const res = await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({ code })
        .expect(200);

      expect(res.body.oauthAction).toBe('created');
    });

    it('3.6 — OAuth exchange does NOT return oauthAction for login (only for created/linked)', async () => {
      const code = randomUUID();
      const mockPayload = {
        accessToken: 'login-token',
        user: {
          id: randomUUID(),
          email: 'returning-oauth@gmail.com',
          role: 'USER',
          emailVerified: true,
          mfaEnabled: false,
          firstName: null,
          lastName: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        cookie: {
          name: 'refresh_token',
          value: 'login-refresh',
          options: {
            httpOnly: true,
            secure: false,
            sameSite: 'strict' as const,
            path: '/',
            maxAge: 43200000,
          },
        },
        oauthAction: 'login',
      };

      await ctx.mockRedis.set(
        `oauth:code:${code}`,
        JSON.stringify(mockPayload),
        'EX',
        60,
      );

      const res = await request(app.getHttpServer())
        .post('/auth/oauth/exchange')
        .send({ code })
        .expect(200);

      // Controller filters out 'login' action — only returns for 'created' or 'linked'
      expect(res.body.oauthAction).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // OAuth redirect endpoints (smoke tests)
  // ═══════════════════════════════════════════════════════════════════

  describe('OAuth redirect endpoints', () => {
    it('GET /auth/google is registered (strategy mocked, may error)', async () => {
      // Google/GitHub strategies are mocked as {}, so they won't redirect.
      // We just verify the route exists and doesn't crash with 404.
      const res = await request(app.getHttpServer()).get('/auth/google');
      // Will likely get 500 (mocked strategy) or 302, but NOT 404
      expect(res.status).not.toBe(404);
    });

    it('GET /auth/github is registered (strategy mocked, may error)', async () => {
      const res = await request(app.getHttpServer()).get('/auth/github');
      expect(res.status).not.toBe(404);
    });
  });
});
