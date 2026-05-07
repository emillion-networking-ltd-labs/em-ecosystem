/**
 * E2E Test Helpers — reusable functions for auth integration tests.
 */
import request from 'supertest';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import type { MockStore, MockUser } from './setup';

// ── Response Types ──────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; role: string };
}

export interface MfaChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
}

export interface MfaSetupRequiredResponse {
  mfaSetupRequired: true;
  message: string;
}

export interface RegisterResponse {
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: { message: string; code: string; statusCode: number };
}

export interface MessageResponse {
  message: string;
}

// ── Registration Helper ─────────────────────────────────────────────

export async function registerUser(
  app: INestApplication<App>,
  email: string,
  password: string,
  expectedStatus = 200,
): Promise<request.Response> {
  return request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password })
    .expect(expectedStatus);
}

// ── Email Verification Helper ───────────────────────────────────────

/**
 * Extracts the verification token from captured emails and calls verify-email.
 * The token is the plain-text token passed to sendVerificationEmail.
 */
export function getVerificationToken(
  capturedEmails: { type: string; to: string; args: any[] }[],
  email: string,
): string | undefined {
  const verificationEmail = [...capturedEmails]
    .reverse()
    .find((e) => e.type === 'verification' && e.to === email);
  // args: [email, token, firstName]
  return verificationEmail?.args[1];
}

export function getPasswordResetToken(
  capturedEmails: { type: string; to: string; args: any[] }[],
  email: string,
): string | undefined {
  const resetEmail = [...capturedEmails]
    .reverse()
    .find((e) => e.type === 'password-reset' && e.to === email);
  return resetEmail?.args[1];
}

/**
 * Manually verify a user's email in the mock store (bypasses email flow).
 */
export function verifyEmailInStore(store: MockStore, email: string): void {
  const user = store.users.find((u) => u.email === email);
  if (user) {
    user.emailVerified = true;
  }
}

// ── Login Helper ────────────────────────────────────────────────────

export async function loginUser(
  app: INestApplication<App>,
  email: string,
  password: string,
  expectedStatus = 200,
): Promise<request.Response> {
  return request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(expectedStatus);
}

/**
 * Register + verify email + login, returning the access token and cookies.
 */
export async function registerAndLogin(
  app: INestApplication<App>,
  store: MockStore,
  email: string,
  password: string,
): Promise<{ accessToken: string; cookies: string[]; user: any }> {
  await registerUser(app, email, password);
  verifyEmailInStore(store, email);
  const res = await loginUser(app, email, password);
  const body = res.body as LoginResponse;
  const cookies = res.headers['set-cookie'] || [];
  return {
    accessToken: body.accessToken,
    cookies: Array.isArray(cookies) ? cookies : [cookies],
    user: body.user,
  };
}

// ── Token Refresh Helper ────────────────────────────────────────────

export async function refreshTokens(
  app: INestApplication<App>,
  cookies: string[],
  expectedStatus = 200,
): Promise<request.Response> {
  const req = request(app.getHttpServer()).post('/auth/refresh');
  if (cookies.length > 0) {
    req.set('Cookie', cookies);
  }
  return req.expect(expectedStatus);
}

// ── Authenticated Request Helpers ───────────────────────────────────

export async function getMe(
  app: INestApplication<App>,
  accessToken: string,
  expectedStatus = 200,
): Promise<request.Response> {
  return request(app.getHttpServer())
    .get('/auth/me')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(expectedStatus);
}

export async function logout(
  app: INestApplication<App>,
  cookies: string[],
  expectedStatus = 200,
): Promise<request.Response> {
  const req = request(app.getHttpServer()).post('/auth/logout');
  if (cookies.length > 0) {
    req.set('Cookie', cookies);
  }
  return req.expect(expectedStatus);
}

export async function logoutAll(
  app: INestApplication<App>,
  accessToken: string,
  expectedStatus = 200,
): Promise<request.Response> {
  return request(app.getHttpServer())
    .post('/auth/logout-all')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(expectedStatus);
}

// ── Password Reset Helpers ──────────────────────────────────────────

export async function forgotPassword(
  app: INestApplication<App>,
  email: string,
  expectedStatus = 200,
): Promise<request.Response> {
  return request(app.getHttpServer())
    .post('/auth/forgot-password')
    .send({ email })
    .expect(expectedStatus);
}

export async function resetPassword(
  app: INestApplication<App>,
  token: string,
  newPassword: string,
  expectedStatus = 200,
): Promise<request.Response> {
  return request(app.getHttpServer())
    .post('/auth/reset-password')
    .send({ token, newPassword })
    .expect(expectedStatus);
}

// ── MFA Helpers ─────────────────────────────────────────────────────

/**
 * Enable MFA for a user directly in the mock store.
 */
export function enableMfaInStore(
  store: MockStore,
  email: string,
  mfaSecret = 'JBSWY3DPEHPK3PXP',
): void {
  const user = store.users.find((u) => u.email === email);
  if (user) {
    user.mfaEnabled = true;
    user.mfaSecret = mfaSecret;
  }
}

// ── Session Helpers ─────────────────────────────────────────────────

export async function getSessions(
  app: INestApplication<App>,
  accessToken: string,
  expectedStatus = 200,
): Promise<request.Response> {
  return request(app.getHttpServer())
    .get('/auth/sessions')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(expectedStatus);
}

export async function revokeSession(
  app: INestApplication<App>,
  accessToken: string,
  sessionId: string,
  expectedStatus = 200,
): Promise<request.Response> {
  return request(app.getHttpServer())
    .delete(`/auth/sessions/${sessionId}`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(expectedStatus);
}

// ── Store Utilities ─────────────────────────────────────────────────

export function findUserInStore(
  store: MockStore,
  email: string,
): MockUser | undefined {
  return store.users.find((u) => u.email === email);
}

/**
 * Hash a plain-text token the same way AuthService does (SHA-256).
 */
export function hashToken(plainToken: string): string {
  return crypto.createHash('sha256').update(plainToken).digest('hex');
}
