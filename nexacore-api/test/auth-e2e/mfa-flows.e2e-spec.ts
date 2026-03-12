/**
 * MFA Flows E2E Tests
 *
 * Flow 2: Login → MFA challenge → verify TOTP → tokens issued
 * Includes: MFA setup, verify-login, recovery codes, disable MFA
 */
import request from 'supertest';
import type { App } from 'supertest/types';
import type { INestApplication } from '@nestjs/common';
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import {
  createE2EApp,
  type E2EContext,
} from './setup';
import {
  registerAndLogin,
  loginUser,
  verifyEmailInStore,
  registerUser,
  type LoginResponse,
  type MfaChallengeResponse,
} from './helpers';

// Create a TOTP instance with the required plugins (otplib v13+ CJS has no `authenticator`)
const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

/** Generate a valid TOTP code for the given secret */
async function generateTOTP(secret: string): Promise<string> {
  return totp.generate({ secret });
}

jest.setTimeout(30_000);

describe('MFA Flows (E2E)', () => {
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
  // FLOW 2: MFA Setup → Login with MFA → Verify TOTP → Tokens
  // ═══════════════════════════════════════════════════════════════════

  describe('Flow 2: MFA lifecycle', () => {
    const email = 'mfa-user@test.com';
    const password = 'SecureP@ss1';
    let accessToken: string;
    let mfaSecret: string;
    let recoveryCodes: string[];

    it('2.1 — Setup: register, verify, login', async () => {
      const result = await registerAndLogin(app, ctx.store, email, password);
      accessToken = result.accessToken;
    });

    it('2.2 — POST /auth/mfa/setup returns secret and QR code', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/mfa/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.secret).toBeDefined();
      expect(res.body.qrCodeDataUrl).toContain('data:image/png');
      expect(res.body.recoveryCodes).toBeDefined();
      expect(res.body.recoveryCodes.length).toBe(10);

      mfaSecret = res.body.secret;
      recoveryCodes = res.body.recoveryCodes;
    });

    it('2.3 — POST /auth/mfa/verify-setup with valid TOTP enables MFA', async () => {
      const totpCode = await generateTOTP(mfaSecret);

      const res = await request(app.getHttpServer())
        .post('/auth/mfa/verify-setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: totpCode })
        .expect(200);

      expect(res.body.message).toContain('MFA enabled');
    });

    it('2.4 — Login now returns MFA challenge', async () => {
      const res = await loginUser(app, email, password);
      const body = res.body as MfaChallengeResponse;
      expect(body.mfaRequired).toBe(true);
      expect(body.mfaToken).toBeDefined();
      // Should NOT contain accessToken — MFA not yet completed
      expect(body).not.toHaveProperty('accessToken');
    });

    it('2.5 — POST /auth/mfa/verify-login with valid TOTP issues tokens', async () => {
      // Login to get fresh mfaToken
      const loginRes = await loginUser(app, email, password);
      const mfaToken = (loginRes.body as MfaChallengeResponse).mfaToken;

      const totpCode = await generateTOTP(mfaSecret);

      const res = await request(app.getHttpServer())
        .post('/auth/mfa/verify-login')
        .send({ mfaToken, code: totpCode })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(email);

      // Refresh token should be set as httpOnly cookie
      expect(res.headers['set-cookie']).toBeDefined();

      accessToken = res.body.accessToken;
    });

    it('2.6 — POST /auth/mfa/verify-login with invalid code fails (401)', async () => {
      const loginRes = await loginUser(app, email, password);
      const mfaToken = (loginRes.body as MfaChallengeResponse).mfaToken;

      await request(app.getHttpServer())
        .post('/auth/mfa/verify-login')
        .send({ mfaToken, code: '000000' })
        .expect(401);
    });

    it('2.7 — POST /auth/mfa/verify-login with expired/invalid mfaToken fails (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/mfa/verify-login')
        .send({ mfaToken: 'invalid.token.here', code: '123456' })
        .expect(401);
    });

    it('2.8 — GET /auth/mfa/status returns enabled with recovery code count', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/mfa/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.mfaEnabled).toBe(true);
      expect(res.body.recoveryCodesRemaining).toBeDefined();
    });

    it('2.9 — Disable MFA with correct password succeeds', async () => {
      const res = await request(app.getHttpServer())
        .delete('/auth/mfa')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password })
        .expect(200);

      expect(res.body.message).toContain('MFA disabled');
    });

    it('2.10 — Login after MFA disabled returns tokens directly (no challenge)', async () => {
      const res = await loginUser(app, email, password);
      const body = res.body as LoginResponse;
      expect(body.accessToken).toBeDefined();
      expect(body).not.toHaveProperty('mfaRequired');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MFA Edge Cases
  // ═══════════════════════════════════════════════════════════════════

  describe('MFA edge cases', () => {
    it('MFA setup requires authentication (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/mfa/setup')
        .expect(401);
    });

    it('MFA setup rejected if already enabled (400)', async () => {
      // Register + login + enable MFA
      const email = 'mfa-dup@test.com';
      const password = 'SecureP@ss1';
      const result = await registerAndLogin(app, ctx.store, email, password);

      // Setup MFA
      const setupRes = await request(app.getHttpServer())
        .post('/auth/mfa/setup')
        .set('Authorization', `Bearer ${result.accessToken}`)
        .expect(201);

      const secret = setupRes.body.secret;
      const totpCode = await generateTOTP(secret);

      await request(app.getHttpServer())
        .post('/auth/mfa/verify-setup')
        .set('Authorization', `Bearer ${result.accessToken}`)
        .send({ token: totpCode })
        .expect(200);

      // Try setup again — should fail
      await request(app.getHttpServer())
        .post('/auth/mfa/setup')
        .set('Authorization', `Bearer ${result.accessToken}`)
        .expect(400);
    });

    it('Disable MFA with wrong password fails (401)', async () => {
      const email = 'mfa-wrongpw@test.com';
      const password = 'SecureP@ss1';
      const result = await registerAndLogin(app, ctx.store, email, password);

      // Enable MFA
      const setupRes = await request(app.getHttpServer())
        .post('/auth/mfa/setup')
        .set('Authorization', `Bearer ${result.accessToken}`)
        .expect(201);

      const totpCode = await generateTOTP(setupRes.body.secret);
      await request(app.getHttpServer())
        .post('/auth/mfa/verify-setup')
        .set('Authorization', `Bearer ${result.accessToken}`)
        .send({ token: totpCode })
        .expect(200);

      // Try to disable with wrong password
      await request(app.getHttpServer())
        .delete('/auth/mfa')
        .set('Authorization', `Bearer ${result.accessToken}`)
        .send({ password: 'WrongP@ss1' })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // Admin MFA enforcement
  // ═══════════════════════════════════════════════════════════════════

  describe('Admin MFA enforcement', () => {
    it('Admin without MFA gets mfaSetupRequired response', async () => {
      const email = 'admin-no-mfa@test.com';
      const password = 'AdminP@ss1';

      await registerUser(app, email, password);
      verifyEmailInStore(ctx.store, email);

      // Promote to ADMIN without enabling MFA
      const user = ctx.store.users.find((u) => u.email === email)!;
      user.role = 'ADMIN';

      const res = await loginUser(app, email, password);
      expect(res.body.mfaSetupRequired).toBe(true);
      expect(res.body.message).toContain('MFA setup is required');
      expect(res.body).not.toHaveProperty('accessToken');
    });
  });
});
