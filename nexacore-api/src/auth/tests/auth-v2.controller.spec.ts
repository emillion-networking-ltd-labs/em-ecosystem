import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantRole } from '@prisma/client';
import type { Request, Response } from 'express';
import { SessionsServiceV2 } from '../../sessions/sessions.service.v2';
import { ErrorMessages } from '../../common/constants/error-messages';
import { REFRESH_TOKEN_COOKIE_NAME_V2 } from '../constants/auth.constants';
import { AuthV2Controller } from '../auth-v2.controller';
import { TokenServiceV2 } from '../token.service.v2';

/**
 * AuthV2Controller spec — SCRUM-494 / AUTH v2 + Tenancy v1 Phase 1.3.
 *
 * Real controller + mocked services + mocked ConfigService. Mirrors SCRUM-491's
 * tenants.controller.spec.ts idiom. Exercises the POST /auth/v2/refresh flow
 * end-to-end against function mocks; cookie assertions via mock Response.
 */

const USER_A = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';
const TENANT_A = 'cccc3333-cccc-3333-cccc-cccc33333333';

function mockReq(cookieValue?: string): Request {
  const cookies: Record<string, string | undefined> = {};
  if (cookieValue !== undefined) {
    cookies[REFRESH_TOKEN_COOKIE_NAME_V2] = cookieValue;
  }
  return { cookies } as unknown as Request;
}

function mockRes(): Response & { cookie: jest.Mock } {
  const cookie = jest.fn();
  return { cookie } as unknown as Response & { cookie: jest.Mock };
}

function rotatedFixture(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 'sess-rotated',
    refreshToken: 'new-plaintext-43-chars-abcdefghijklmnopqrstu',
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    userId: USER_A,
    tenantId: TENANT_A,
    tenantRole: TenantRole.MEMBER,
    isPlatformAdmin: false,
    ...overrides,
  };
}

describe('AuthV2Controller — POST /auth/v2/refresh', () => {
  let controller: AuthV2Controller;
  let sessionsServiceV2: jest.Mocked<
    Pick<SessionsServiceV2, 'validateAndRotate'>
  >;
  let tokenServiceV2: jest.Mocked<Pick<TokenServiceV2, 'mintAccessToken'>>;

  async function buildController(isProduction = false): Promise<void> {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthV2Controller],
      providers: [
        {
          provide: SessionsServiceV2,
          useValue: { validateAndRotate: jest.fn() },
        },
        {
          provide: TokenServiceV2,
          useValue: { mintAccessToken: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'app.isProduction': isProduction,
                'auth.jwtRefreshExpiration': '12h',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();
    controller = moduleRef.get(AuthV2Controller);
    sessionsServiceV2 = moduleRef.get(SessionsServiceV2);
    tokenServiceV2 = moduleRef.get(TokenServiceV2);
  }

  beforeEach(async () => {
    await buildController(false);
  });

  describe('happy path', () => {
    beforeEach(() => {
      sessionsServiceV2.validateAndRotate.mockResolvedValue(rotatedFixture());
      tokenServiceV2.mintAccessToken.mockReturnValue('access-token-jwt');
    });

    it('returns { accessToken, user } with the rotated canonical values', async () => {
      const req = mockReq('any-plaintext-refresh');
      const res = mockRes();

      const result = await controller.refresh(req, res);

      expect(result).toEqual({
        accessToken: 'access-token-jwt',
        user: {
          id: USER_A,
          tenantId: TENANT_A,
          tenantRole: TenantRole.MEMBER,
          isPlatformAdmin: false,
        },
      });
    });

    it('calls validateAndRotate with the cookie value', async () => {
      const req = mockReq('the-opaque-token-value');
      const res = mockRes();
      await controller.refresh(req, res);
      expect(sessionsServiceV2.validateAndRotate).toHaveBeenCalledWith(
        'the-opaque-token-value',
      );
    });

    it('calls mintAccessToken with the rotated session canonical values', async () => {
      const req = mockReq('any');
      const res = mockRes();
      await controller.refresh(req, res);
      expect(tokenServiceV2.mintAccessToken).toHaveBeenCalledWith({
        userId: USER_A,
        sessionId: 'sess-rotated',
        tenantId: TENANT_A,
        tenantRole: TenantRole.MEMBER,
        isPlatformAdmin: false,
      });
    });

    it('sets the new refresh cookie with httpOnly + sameSite=strict + path=/', async () => {
      const req = mockReq('any');
      const res = mockRes();
      await controller.refresh(req, res);
      expect(res.cookie).toHaveBeenCalledTimes(1);
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE_NAME_V2,
        'new-plaintext-43-chars-abcdefghijklmnopqrstu',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          secure: false, // non-production
        }),
      );
    });

    it('cookie maxAge matches parseDurationMs("12h") / 1000 (43200 seconds)', async () => {
      const req = mockReq('any');
      const res = mockRes();
      await controller.refresh(req, res);
      const callArgs = res.cookie.mock.calls[0];
      const options = callArgs[2] as { maxAge: number };
      expect(options.maxAge).toBe(12 * 60 * 60); // 12h in seconds
    });

    it('cookie secure=true when ConfigService reports app.isProduction=true', async () => {
      await buildController(true);
      sessionsServiceV2.validateAndRotate.mockResolvedValue(rotatedFixture());
      tokenServiceV2.mintAccessToken.mockReturnValue('access-token-jwt');

      const req = mockReq('any');
      const res = mockRes();
      await controller.refresh(req, res);
      const callArgs = res.cookie.mock.calls[0];
      const options = callArgs[2] as { secure: boolean };
      expect(options.secure).toBe(true);
    });
  });

  describe('rejection paths', () => {
    it('throws UnauthorizedException with the generic message when the cookie is missing — and does NOT call validateAndRotate', async () => {
      const req = mockReq(undefined);
      const res = mockRes();

      try {
        await controller.refresh(req, res);
        fail('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(UnauthorizedException);
        expect((e as UnauthorizedException).message).toBe(
          ErrorMessages.auth.AUTHENTICATION_FAILED,
        );
      }
      expect(sessionsServiceV2.validateAndRotate).not.toHaveBeenCalled();
      expect(tokenServiceV2.mintAccessToken).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('propagates UnauthorizedException from validateAndRotate unchanged (pass-through)', async () => {
      sessionsServiceV2.validateAndRotate.mockRejectedValue(
        new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED),
      );

      const req = mockReq('bad-token');
      const res = mockRes();

      try {
        await controller.refresh(req, res);
        fail('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(UnauthorizedException);
        expect((e as UnauthorizedException).message).toBe(
          ErrorMessages.auth.AUTHENTICATION_FAILED,
        );
      }
      expect(tokenServiceV2.mintAccessToken).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('propagates synthetic infrastructure error from validateAndRotate (no swallow)', async () => {
      const infraError = new Error('DB connection lost');
      sessionsServiceV2.validateAndRotate.mockRejectedValue(infraError);

      const req = mockReq('any');
      const res = mockRes();

      await expect(controller.refresh(req, res)).rejects.toBe(infraError);
      expect(tokenServiceV2.mintAccessToken).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('propagates mintAccessToken error (rotation already committed → orphan rotation; documented)', async () => {
      sessionsServiceV2.validateAndRotate.mockResolvedValue(rotatedFixture());
      const mintError = new Error('JwtModule misconfig');
      tokenServiceV2.mintAccessToken.mockImplementation(() => {
        throw mintError;
      });

      const req = mockReq('any');
      const res = mockRes();

      await expect(controller.refresh(req, res)).rejects.toBe(mintError);
      // rotation already committed (mock recorded the call), but no cookie set
      expect(sessionsServiceV2.validateAndRotate).toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('response shape contract', () => {
    it('body has exactly { accessToken, user: { id, tenantId, tenantRole, isPlatformAdmin } } — no extra keys', async () => {
      sessionsServiceV2.validateAndRotate.mockResolvedValue(rotatedFixture());
      tokenServiceV2.mintAccessToken.mockReturnValue('access-token-jwt');

      const req = mockReq('any');
      const res = mockRes();
      const result = await controller.refresh(req, res);

      expect(Object.keys(result).sort()).toEqual(['accessToken', 'user']);
      expect(Object.keys(result.user).sort()).toEqual([
        'id',
        'isPlatformAdmin',
        'tenantId',
        'tenantRole',
      ]);
      // SECURITY: response body must NOT contain the new refresh token
      // (cookie-only by design — XSS-resistant).
      expect(result).not.toHaveProperty('refreshToken');
    });
  });
});
