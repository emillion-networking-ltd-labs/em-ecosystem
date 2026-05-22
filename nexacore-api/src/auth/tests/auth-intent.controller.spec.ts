import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  GoneException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthIntentStatus } from '@prisma/client';
import type { Request, Response } from 'express';

// otplib stub — controller transitively imports AuthIntentService → otplib (ESM @scure/base).
jest.mock('otplib', () => ({ verify: jest.fn() }));

import { AuthIntentController } from '../auth-intent.controller';
import { AuthIntentService } from '../auth-intent.service';
import { ErrorMessages } from '../../common/constants/error-messages';
import { REFRESH_TOKEN_COOKIE_NAME_V2 } from '../constants/auth.constants';

/**
 * AuthIntentController spec — SCRUM-497 / Phase 2.2.
 * Mocked AuthIntentService + ConfigService. Validates:
 *   - feature flag gate (404 when off)
 *   - happy-path response shapes per status
 *   - cookie set on succeeded
 *   - service-thrown exceptions propagate (401, 410)
 */

function mockReq(): Request {
  return {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'jest' },
  } as unknown as Request;
}

function mockRes(): { cookie: jest.Mock } & Response {
  return { cookie: jest.fn() } as unknown as { cookie: jest.Mock } & Response;
}

describe('AuthIntentController', () => {
  let controller: AuthIntentController;
  let authIntentServiceMock: {
    createIntent: jest.Mock;
    advance: jest.Mock;
  };
  let configValues: Record<string, unknown>;

  beforeEach(async () => {
    authIntentServiceMock = {
      createIntent: jest.fn(),
      advance: jest.fn(),
    };
    configValues = {
      'app.authIntentV2Enabled': true,
      'app.isProduction': false,
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthIntentController],
      providers: [
        { provide: AuthIntentService, useValue: authIntentServiceMock },
        {
          provide: ConfigService,
          useValue: { get: (k: string) => configValues[k] },
        },
      ],
    }).compile();
    controller = moduleRef.get(AuthIntentController);
  });

  describe('feature flag', () => {
    it('POST /intents → 404 when authIntentV2Enabled=false', async () => {
      configValues['app.authIntentV2Enabled'] = false;
      try {
        await controller.create(mockReq(), {});
        fail('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect((e as NotFoundException).message).toBe(
          ErrorMessages.auth.AUTHENTICATION_FAILED,
        );
      }
      expect(authIntentServiceMock.createIntent).not.toHaveBeenCalled();
    });

    it('POST /intents/:id/advance → 404 when authIntentV2Enabled=false', async () => {
      configValues['app.authIntentV2Enabled'] = false;
      await expect(
        controller.advance(
          'iiii',
          { kind: 'credentials', email: 'a@a.com', password: 'pw12345678' },
          mockReq(),
          mockRes(),
        ),
      ).rejects.toThrow(NotFoundException);
      expect(authIntentServiceMock.advance).not.toHaveBeenCalled();
    });
  });

  describe('POST /intents', () => {
    it('creates intent and returns nextStep=credentials', async () => {
      const expiresAt = new Date(Date.now() + 900_000);
      authIntentServiceMock.createIntent.mockResolvedValue({
        id: 'iiii',
        status: 'requires_credentials',
        expiresAt,
      });

      const result = await controller.create(mockReq(), {});

      expect(result.id).toBe('iiii');
      expect(result.status).toBe('requires_credentials');
      expect(result.nextStep).toBe('credentials');
      expect(result.expiresAt).toBe(expiresAt);
      expect(authIntentServiceMock.createIntent).toHaveBeenCalledWith({
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      });
    });
  });

  describe('POST /intents/:id/advance', () => {
    it('credentials → requires_mfa shape (no cookie)', async () => {
      const res = mockRes();
      authIntentServiceMock.advance.mockResolvedValue({
        id: 'iiii',
        status: 'requires_mfa' as AuthIntentStatus,
        expiresAt: new Date(),
      });

      const result = await controller.advance(
        'iiii',
        { kind: 'credentials', email: 'a@a.com', password: 'pw12345678' },
        mockReq(),
        res,
      );

      expect(result.status).toBe('requires_mfa');
      expect(result.nextStep).toBe('mfa');
      expect(result.accessToken).toBeUndefined();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('credentials (multi-tenant) → requires_tenant_pick shape with availableTenantIds', async () => {
      const res = mockRes();
      authIntentServiceMock.advance.mockResolvedValue({
        id: 'iiii',
        status: 'requires_tenant_pick' as AuthIntentStatus,
        expiresAt: new Date(),
        availableTenantIds: ['ta', 'tb'],
      });

      const result = await controller.advance(
        'iiii',
        { kind: 'credentials', email: 'a@a.com', password: 'pw12345678' },
        mockReq(),
        res,
      );

      expect(result.status).toBe('requires_tenant_pick');
      expect(result.nextStep).toBe('tenant_pick');
      expect(result.availableTenantIds).toEqual(['ta', 'tb']);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('succeeded → accessToken + user payload + refresh cookie set', async () => {
      const res = mockRes();
      authIntentServiceMock.advance.mockResolvedValue({
        id: 'iiii',
        status: 'succeeded' as AuthIntentStatus,
        expiresAt: new Date(),
        accessToken: 'access-token-xyz',
        refreshToken: 'opaque-token-xyz',
        refreshMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
        user: {
          id: 'uuuu',
          tenantId: 'tttt',
          tenantRole: 'MEMBER',
          isPlatformAdmin: false,
        },
      });

      const result = await controller.advance(
        'iiii',
        { kind: 'tenant_pick', tenantId: 'tttt' },
        mockReq(),
        res,
      );

      expect(result.status).toBe('succeeded');
      expect(result.nextStep).toBeNull();
      expect(result.accessToken).toBe('access-token-xyz');
      expect(result.user?.tenantId).toBe('tttt');
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE_NAME_V2,
        'opaque-token-xyz',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          secure: false, // isProduction=false in test fixture
        }),
      );
    });

    it('service throws UnauthorizedException → controller propagates 401', async () => {
      authIntentServiceMock.advance.mockRejectedValue(
        new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED),
      );

      await expect(
        controller.advance(
          'iiii',
          { kind: 'credentials', email: 'a@a.com', password: 'pw12345678' },
          mockReq(),
          mockRes(),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('service throws GoneException → controller propagates 410', async () => {
      authIntentServiceMock.advance.mockRejectedValue(
        new GoneException(ErrorMessages.auth.AUTHENTICATION_FAILED),
      );

      await expect(
        controller.advance(
          'iiii',
          { kind: 'credentials', email: 'a@a.com', password: 'pw12345678' },
          mockReq(),
          mockRes(),
        ),
      ).rejects.toThrow(GoneException);
    });
  });
});
