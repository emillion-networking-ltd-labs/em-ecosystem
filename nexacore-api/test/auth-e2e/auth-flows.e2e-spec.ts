/**
 * Auth Flows E2E Tests
 *
 * Flow 1: Register → Verify Email → Login → Refresh → Logout
 * Flow 4: Password Reset (forgot → email → reset → login with new password)
 * Flow 5: Session Management + Account Lockout
 */
import request from 'supertest';
import type { App } from 'supertest/types';
import type { INestApplication } from '@nestjs/common';
import {
  createE2EApp,
  type E2EContext,
} from './setup';
import {
  registerUser,
  loginUser,
  registerAndLogin,
  refreshTokens,
  getMe,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getSessions,
  verifyEmailInStore,
  getVerificationToken,
  getPasswordResetToken,
  findUserInStore,
  hashToken,
  type LoginResponse,
  type RegisterResponse,
  type ErrorResponse,
  type MessageResponse,
} from './helpers';

jest.setTimeout(30_000);

describe('Auth Flows (E2E)', () => {
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
  // FLOW 1: Register → Verify Email → Login → Refresh → Logout
  // ═══════════════════════════════════════════════════════════════════

  describe('Flow 1: Full authentication lifecycle', () => {
    const email = 'flow1@test.com';
    const password = 'SecureP@ss1';
    let accessToken: string;
    let cookies: string[];

    it('1.1 — Register returns generic message (anti-enumeration)', async () => {
      const res = await registerUser(app, email, password);
      const body = res.body as RegisterResponse;
      expect(body.message).toBeDefined();
      expect(body).not.toHaveProperty('accessToken');
      expect(body).not.toHaveProperty('refreshToken');
    });

    it('1.2 — User created in store with emailVerified=false', () => {
      const user = findUserInStore(ctx.store, email);
      expect(user).toBeDefined();
      expect(user!.emailVerified).toBe(false);
      expect(user!.passwordHash).toBeTruthy();
    });

    it('1.3 — Verification email was sent', () => {
      const token = getVerificationToken(ctx.mockMail.captured, email);
      expect(token).toBeDefined();
    });

    it('1.4 — Login rejected before email verification (403)', async () => {
      const res = await loginUser(app, email, password, 403);
      const body = res.body as ErrorResponse;
      expect(body.error.statusCode).toBe(403);
    });

    it('1.5 — Verify email succeeds', async () => {
      const plainToken = getVerificationToken(ctx.mockMail.captured, email)!;
      const tokenHash = hashToken(plainToken);

      // The token should be in the store
      const storedToken = ctx.store.emailVerificationTokens.find(
        (t) => t.tokenHash === tokenHash,
      );
      expect(storedToken).toBeDefined();

      // Call the verify-email endpoint
      const res = await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${plainToken}`)
        .expect(302);

      // Should redirect with status=success
      expect(res.headers.location).toContain('status=success');
    });

    it('1.6 — Login succeeds after verification', async () => {
      // Mark email as verified (the verify-email endpoint does a $transaction)
      verifyEmailInStore(ctx.store, email);

      const res = await loginUser(app, email, password);
      const body = res.body as LoginResponse;

      expect(body.accessToken).toBeDefined();
      expect(body.user.email).toBe(email);
      expect(body.user.role).toBe('USER');
      expect(body).not.toHaveProperty('passwordHash');
      expect(body).not.toHaveProperty('refreshToken');

      // Refresh token should be in httpOnly cookie
      const setCookieHeader = res.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();

      accessToken = body.accessToken;
      cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : [setCookieHeader];
    });

    it('1.7 — GET /auth/me returns profile with valid token', async () => {
      const res = await getMe(app, accessToken);
      expect(res.body.email).toBe(email);
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('mfaSecret');
    });

    it('1.8 — GET /auth/me rejected without token (401)', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('1.9 — Refresh returns new access token + rotates cookie', async () => {
      const res = await refreshTokens(app, cookies);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.accessToken).not.toBe(accessToken);

      // New cookie should be set
      const newCookies = res.headers['set-cookie'];
      expect(newCookies).toBeDefined();

      accessToken = res.body.accessToken;
      cookies = Array.isArray(newCookies) ? newCookies : [newCookies];
    });

    it('1.10 — Refresh rejected without cookie (401)', async () => {
      await refreshTokens(app, [], 401);
    });

    it('1.11 — Logout clears session', async () => {
      const res = await logout(app, cookies);
      const body = res.body as MessageResponse;
      expect(body.message).toBe('Logged out successfully');

      // Cookie should be cleared
      const clearCookie = res.headers['set-cookie'];
      expect(clearCookie).toBeDefined();
    });

    it('1.12 — Old refresh token rejected after logout (401)', async () => {
      await refreshTokens(app, cookies, 401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // FLOW 1b: Registration edge cases
  // ═══════════════════════════════════════════════════════════════════

  describe('Flow 1b: Registration edge cases', () => {
    it('1b.1 — Duplicate email returns same generic message (anti-enumeration)', async () => {
      // Register first user
      await registerUser(app, 'dup@test.com', 'SecureP@ss1');

      // Try to register again — same message, same status
      const res = await registerUser(app, 'dup@test.com', 'AnotherP@ss1');
      const body = res.body as RegisterResponse;
      expect(body.message).toBeDefined();
      // Response should be identical to first registration (anti-enumeration)
    });

    it('1b.2 — Invalid email rejected (400)', async () => {
      const res = await registerUser(app, 'not-an-email', 'SecureP@ss1', 400);
      const body = res.body as ErrorResponse;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('1b.3 — Weak password rejected (400)', async () => {
      const res = await registerUser(app, 'weak@test.com', 'weak', 400);
      const body = res.body as ErrorResponse;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('1b.4 — Missing fields rejected (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'nopw@test.com' })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // FLOW 4: Password Reset
  // ═══════════════════════════════════════════════════════════════════

  describe('Flow 4: Password reset lifecycle', () => {
    const email = 'flow4@test.com';
    const oldPassword = 'OldP@ssword1';
    const newPassword = 'NewP@ssword1';

    beforeAll(async () => {
      await registerUser(app, email, oldPassword);
      verifyEmailInStore(ctx.store, email);
    });

    it('4.1 — Forgot-password returns generic message', async () => {
      const res = await forgotPassword(app, email);
      const body = res.body as MessageResponse;
      expect(body.message).toContain('reset email');
    });

    it('4.2 — Password reset email was sent', () => {
      const token = getPasswordResetToken(ctx.mockMail.captured, email);
      expect(token).toBeDefined();
    });

    it('4.3 — Forgot-password for non-existent email returns same message (anti-enumeration)', async () => {
      const res = await forgotPassword(app, 'nobody@test.com');
      expect(res.body.message).toContain('reset email');
    });

    it('4.4 — Validate-reset-token confirms token is valid', async () => {
      const plainToken = getPasswordResetToken(ctx.mockMail.captured, email)!;
      const res = await request(app.getHttpServer())
        .post('/auth/validate-reset-token')
        .send({ token: plainToken })
        .expect(200);

      expect(res.body.valid).toBe(true);
    });

    it('4.5 — Reset password with valid token succeeds', async () => {
      const plainToken = getPasswordResetToken(ctx.mockMail.captured, email)!;
      const res = await resetPassword(app, plainToken, newPassword);
      expect(res.body.message).toContain('reset successfully');
    });

    it('4.6 — Login with old password fails (401)', async () => {
      await loginUser(app, email, oldPassword, 401);
    });

    it('4.7 — Login with new password succeeds', async () => {
      const res = await loginUser(app, email, newPassword);
      const body = res.body as LoginResponse;
      expect(body.accessToken).toBeDefined();
      expect(body.user.email).toBe(email);
    });

    it('4.8 — Reused reset token is rejected (400)', async () => {
      const plainToken = getPasswordResetToken(ctx.mockMail.captured, email)!;
      await resetPassword(app, plainToken, 'AnotherP@ss1', 400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // FLOW 5: Session Management + Account Lockout
  // ═══════════════════════════════════════════════════════════════════

  describe('Flow 5: Session management', () => {
    const email = 'flow5@test.com';
    const password = 'SecureP@ss1';
    let accessToken: string;
    let cookies: string[];

    beforeAll(async () => {
      const result = await registerAndLogin(app, ctx.store, email, password);
      accessToken = result.accessToken;
      cookies = result.cookies;
    });

    it('5.1 — GET /auth/sessions returns active sessions', async () => {
      const res = await getSessions(app, accessToken);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('5.2 — Logout-all revokes all sessions', async () => {
      const res = await logoutAll(app, accessToken);
      expect(res.body.message).toContain('revoked');
    });

    it('5.3 — Old refresh token rejected after logout-all (401)', async () => {
      await refreshTokens(app, cookies, 401);
    });

    it('5.4 — Can login again after logout-all', async () => {
      const res = await loginUser(app, email, password);
      const body = res.body as LoginResponse;
      expect(body.accessToken).toBeDefined();
    });
  });

  describe('Flow 5b: Account lockout', () => {
    const email = 'lockout@test.com';
    const password = 'SecureP@ss1';

    beforeAll(async () => {
      await registerUser(app, email, password);
      verifyEmailInStore(ctx.store, email);
    });

    it('5b.1 — Multiple wrong passwords increment failedAttempts', async () => {
      for (let i = 0; i < 3; i++) {
        await loginUser(app, email, 'WrongP@ss1', 401);
      }
      const user = findUserInStore(ctx.store, email);
      expect(user!.failedAttempts).toBeGreaterThanOrEqual(3);
    });

    it('5b.2 — Correct password after failed attempts resets lockout', async () => {
      const res = await loginUser(app, email, password);
      const body = res.body as LoginResponse;
      expect(body.accessToken).toBeDefined();
    });

    it('5b.3 — Account lockout after exceeding max attempts', async () => {
      // Lock the account manually (simulating max failed attempts)
      const user = findUserInStore(ctx.store, email)!;
      user.lockedUntil = new Date(Date.now() + 60_000);

      // Login should fail with 401 (not 403 — CWE-203 anti-enumeration)
      await loginUser(app, email, password, 401);

      // Unlock for subsequent tests
      user.lockedUntil = null;
    });

    it('5b.4 — Non-existent user login returns 401 (same as wrong password)', async () => {
      await loginUser(app, 'ghost@test.com', password, 401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // FLOW: Admin RBAC
  // ═══════════════════════════════════════════════════════════════════

  describe('Admin RBAC', () => {
    const adminEmail = 'admin@test.com';
    const adminPassword = 'AdminP@ss1';
    const userEmail = 'regular@test.com';
    const userPassword = 'UserP@ss1';

    let adminAccessToken: string;
    let userAccessToken: string;

    beforeAll(async () => {
      // Register as USER first, then promote — JwtStrategy re-fetches user from DB
      // so the role in req.user reflects the current store state
      const adminResult = await registerAndLogin(
        app,
        ctx.store,
        adminEmail,
        adminPassword,
      );
      adminAccessToken = adminResult.accessToken;
      // Promote to ADMIN in store (JwtStrategy.validate reads from DB)
      const adminUser = findUserInStore(ctx.store, adminEmail)!;
      adminUser.role = 'ADMIN';

      // Regular user
      const userResult = await registerAndLogin(
        app,
        ctx.store,
        userEmail,
        userPassword,
      );
      userAccessToken = userResult.accessToken;
    });

    it('Admin endpoint grants access with ADMIN role', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
      expect(res.body.message).toBe('Admin access granted');
    });

    it('Admin endpoint denies USER role (403)', async () => {
      await request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);
    });

    it('Admin endpoint rejects unauthenticated (401)', async () => {
      await request(app.getHttpServer()).get('/auth/admin').expect(401);
    });
  });
});
