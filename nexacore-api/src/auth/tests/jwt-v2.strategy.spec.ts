import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantRole } from '@prisma/client';
import { ErrorMessages } from '../../common/constants/error-messages';
import { JwtV2Strategy } from '../strategies/jwt-v2.strategy';

/**
 * JwtV2Strategy spec — SCRUM-494 / AUTH v2 + Tenancy v1 Phase 1.3.
 *
 * Gate-2 (shape) unit tests. Gate-1 (crypto) is JwtModule's responsibility
 * (already covered in token.service.v2.spec.ts roundtrip tests). This spec
 * exercises validate(payload) directly — Passport doesn't need to be wired.
 */

function validV2Payload(overrides: Record<string, unknown> = {}) {
  return {
    sub: 'aaaa1111-aaaa-1111-aaaa-aaaa11111111',
    jti: 'jti-abc',
    sessionId: 'sess-xyz',
    iat: Math.floor(Date.now() / 1000),
    tenantId: 'cccc3333-cccc-3333-cccc-cccc33333333',
    tenantRole: TenantRole.MEMBER,
    isPlatformAdmin: false,
    ...overrides,
  };
}

describe('JwtV2Strategy', () => {
  let strategy: JwtV2Strategy;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        JwtV2Strategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'auth.jwtSecret':
                  'test-secret-that-is-at-least-32-characters-long',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();
    strategy = moduleRef.get<JwtV2Strategy>(JwtV2Strategy);
  });

  describe('validate — happy path', () => {
    it('returns the typed payload for a valid v2 shape', async () => {
      const payload = validV2Payload();
      const result = await strategy.validate(payload);
      expect(result).toEqual(payload);
    });

    it('returns the typed payload with isPlatformAdmin=true', async () => {
      const payload = validV2Payload({ isPlatformAdmin: true });
      const result = await strategy.validate(payload);
      expect(result.isPlatformAdmin).toBe(true);
    });
  });

  describe('validate — rejection paths (no failure-mode enumeration)', () => {
    function assertSameException(err: unknown) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).message).toBe(
        ErrorMessages.auth.AUTHENTICATION_FAILED,
      );
    }

    it('rejects payload missing sub', async () => {
      const payload = validV2Payload();
      delete (payload as Record<string, unknown>).sub;
      try {
        await strategy.validate(payload);
        fail('expected throw');
      } catch (e) {
        assertSameException(e);
      }
    });

    it('rejects payload missing jti', async () => {
      const payload = validV2Payload();
      delete (payload as Record<string, unknown>).jti;
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects payload missing sessionId', async () => {
      const payload = validV2Payload();
      delete (payload as Record<string, unknown>).sessionId;
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects payload missing iat', async () => {
      const payload = validV2Payload();
      delete (payload as Record<string, unknown>).iat;
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects payload missing tenantId', async () => {
      const payload = validV2Payload();
      delete (payload as Record<string, unknown>).tenantId;
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects payload missing tenantRole', async () => {
      const payload = validV2Payload();
      delete (payload as Record<string, unknown>).tenantRole;
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects payload missing isPlatformAdmin', async () => {
      const payload = validV2Payload();
      delete (payload as Record<string, unknown>).isPlatformAdmin;
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects non-boolean isPlatformAdmin', async () => {
      const payload = validV2Payload({ isPlatformAdmin: 'true' });
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forged v1-shape rejection', () => {
    it('rejects a v1-shape payload (email + role but missing v2 keys)', async () => {
      const v1Forged = {
        sub: 'aaaa1111-aaaa-1111-aaaa-aaaa11111111',
        email: 'forged@example.com',
        role: 'USER',
        jti: 'jti-x',
        iat: Math.floor(Date.now() / 1000),
        // intentionally NO sessionId, tenantId, tenantRole, isPlatformAdmin
      };
      await expect(strategy.validate(v1Forged)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('exception-message invariance', () => {
    it('all rejection paths throw the bit-identical AUTHENTICATION_FAILED message', async () => {
      const messages: string[] = [];

      const cases: Array<Record<string, unknown>> = [
        {},
        validV2Payload({ sub: undefined }),
        validV2Payload({ jti: 123 }),
        validV2Payload({ sessionId: null }),
        validV2Payload({ iat: 'not-a-number' }),
        validV2Payload({ tenantId: 42 }),
        validV2Payload({ tenantRole: null }),
        validV2Payload({ isPlatformAdmin: 'true' }),
      ];

      for (const payload of cases) {
        try {
          await strategy.validate(payload);
          fail('expected throw');
        } catch (e) {
          messages.push((e as UnauthorizedException).message);
        }
      }

      expect(messages).toHaveLength(8);
      expect(new Set(messages).size).toBe(1);
      expect(messages[0]).toBe(ErrorMessages.auth.AUTHENTICATION_FAILED);
    });
  });
});
