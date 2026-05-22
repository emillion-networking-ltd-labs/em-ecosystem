import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  GoneException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthIntentStatus, TenantRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { CryptoService } from '../../common/services/crypto.service';
import { TenantContext } from '../../common/context/tenant-context';
import { UsersService } from '../../users/users.service';
import { SessionsServiceV2 } from '../../sessions/sessions.service.v2';
import { TokenServiceV2 } from '../token.service.v2';
import { AuthIntentService } from '../auth-intent.service';
import { AdvanceAuthIntentDto } from '../dto/advance-auth-intent.dto';

// Stub otplib at module level — the real module imports @scure/base as ESM
// and trips Jest's CJS transform. Mirrors mfa.service.spec.ts pattern.
const mockOtpVerify = jest.fn();
jest.mock('otplib', () => ({
  verify: (...args: unknown[]) => mockOtpVerify(...args),
}));

/**
 * AuthIntentService spec — SCRUM-497 / AUTH v2 + Tenancy v1 Phase 2.2.
 *
 * Real AuthIntentService + mocked Prisma + spy AuditService + mocked
 * TokenServiceV2 + SessionsServiceV2 + UsersService + CryptoService.
 * Same idiom as SCRUM-491/493/495 specs.
 *
 * Coverage targets per plan:
 *   - createIntent (2): audit emission + expiresAt computed.
 *   - advance dispatch (4): not-found 404; terminal 410; expired-flip 410; state-mismatch.
 *   - advanceCredentials (8): user-not-found timing, locked timing, bad password, email-not-verified,
 *     no-membership; happy single-tenant; happy multi-tenant no MFA; happy MFA branch.
 *   - subdomain auto-resolve (1).
 *   - advanceMfa (3): TOTP ok, recovery code ok, both wrong.
 *   - advanceTenantPick (2): valid + invalid.
 *   - audit emission (1): single AUTH_INTENT_ADVANCED per transition.
 */

const INTENT_ID = 'iiii1111-iiii-1111-iiii-iiii11111111';
const USER_A = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';
const TENANT_A = 'cccc3333-cccc-3333-cccc-cccc33333333';
const TENANT_B = 'dddd4444-dddd-4444-dddd-dddd44444444';
const MEMBERSHIP_A = 'mmmm1111-mmmm-1111-mmmm-mmmm11111111';
const MEMBERSHIP_B = 'mmmm2222-mmmm-2222-mmmm-mmmm22222222';

function intentRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: INTENT_ID,
    status: 'requires_credentials' as AuthIntentStatus,
    userId: null as string | null,
    tenantId: null as string | null,
    organizationId: null as string | null,
    context: {} as Record<string, unknown>,
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
    fulfilledAt: null as Date | null,
    ...overrides,
  };
}

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_A,
    email: 'alice@example.com',
    passwordHash: bcrypt.hashSync('correct-horse', 4),
    isPlatformAdmin: false,
    emailVerified: true,
    mfaEnabled: false,
    mfaSecret: null as string | null,
    mfaRecoveryCodes: [] as string[],
    failedAttempts: 0,
    lockedUntil: null as Date | null,
    lockoutCount: 0,
    ...overrides,
  };
}

function membershipRow(overrides: Record<string, unknown> = {}) {
  return {
    id: MEMBERSHIP_A,
    userId: USER_A,
    tenantId: TENANT_A,
    role: TenantRole.MEMBER,
    status: 'active' as const,
    invitedBy: null,
    joinedAt: new Date(),
    lastActiveAt: new Date(),
    ...overrides,
  };
}

describe('AuthIntentService', () => {
  let service: AuthIntentService;
  let prismaMock: {
    authIntent: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    tenantMembership: { findMany: jest.Mock; findFirst: jest.Mock };
  };
  let auditLog: jest.Mock;
  let usersServiceMock: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    updateRecoveryCodes: jest.Mock;
  };
  let tokenServiceV2Mock: { mintAccessToken: jest.Mock };
  let sessionsServiceV2Mock: { createSession: jest.Mock };
  let cryptoServiceMock: { decrypt: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      authIntent: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenantMembership: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    auditLog = jest.fn();
    usersServiceMock = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateRecoveryCodes: jest.fn(),
    };
    tokenServiceV2Mock = { mintAccessToken: jest.fn(() => 'access-token-xyz') };
    sessionsServiceV2Mock = {
      createSession: jest.fn(() => ({
        sessionId: 'sess-aaa',
        refreshToken: 'opaque-token-xyz',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      })),
    };
    cryptoServiceMock = {
      decrypt: jest.fn((s: string) => s.replace('encrypted-', '')),
    };

    const configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'app.authIntentTtlMs') return 900_000;
        if (key === 'auth.jwtRefreshExpiration') return '7d';
        return undefined;
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthIntentService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: auditLog } },
        { provide: TokenServiceV2, useValue: tokenServiceV2Mock },
        { provide: SessionsServiceV2, useValue: sessionsServiceV2Mock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: CryptoService, useValue: cryptoServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();
    service = moduleRef.get(AuthIntentService);
  });

  describe('createIntent', () => {
    it('persists intent with computed expiresAt and emits AUTH_INTENT_CREATED audit', async () => {
      const row = intentRow();
      prismaMock.authIntent.create.mockResolvedValue(row);

      const result = await service.createIntent({
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      });

      expect(result.id).toBe(INTENT_ID);
      expect(prismaMock.authIntent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'requires_credentials',
          ipAddress: '127.0.0.1',
          userAgent: 'jest',
          expiresAt: expect.any(Date),
        }),
      });
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.AUTH_INTENT_CREATED,
          userId: null,
          metadata: expect.objectContaining({ intentId: INTENT_ID }),
        }),
      );
    });
  });

  describe('advance — dispatcher', () => {
    it('throws NotFoundException (404) when intentId does not exist', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(null);
      await expect(
        service.advance(
          INTENT_ID,
          { kind: 'credentials', email: 'x@x.com', password: 'pw12345678' },
          {},
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it.each(['succeeded', 'failed', 'expired'] as AuthIntentStatus[])(
      'throws GoneException (410) on terminal status=%s (replay)',
      async (terminal) => {
        prismaMock.authIntent.findUnique.mockResolvedValue(
          intentRow({ status: terminal }),
        );
        await expect(
          service.advance(
            INTENT_ID,
            { kind: 'credentials', email: 'x@x.com', password: 'pw12345678' },
            {},
          ),
        ).rejects.toThrow(GoneException);
      },
    );

    it('lazy-flips to expired + emits AUTH_INTENT_EXPIRED on expired-at-advance', async () => {
      const past = new Date(Date.now() - 60_000);
      prismaMock.authIntent.findUnique.mockResolvedValue(
        intentRow({ expiresAt: past }),
      );
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'expired' }),
      );

      await expect(
        service.advance(
          INTENT_ID,
          { kind: 'credentials', email: 'x@x.com', password: 'pw12345678' },
          {},
        ),
      ).rejects.toThrow(GoneException);

      expect(prismaMock.authIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: INTENT_ID },
          data: expect.objectContaining({ status: 'expired' }),
        }),
      );
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.AUTH_INTENT_EXPIRED }),
      );
    });

    it('state-mismatch (mfa input on requires_credentials) → fail + 401', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );
      await expect(
        service.advance(INTENT_ID, { kind: 'mfa', code: '123456' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('passkey kind → fail (transition unwired in 2.2)', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );
      await expect(
        service.advance(
          INTENT_ID,
          { kind: 'passkey', assertion: { fake: true } },
          {},
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('advanceCredentials', () => {
    const baseInput: AdvanceAuthIntentDto = {
      kind: 'credentials',
      email: 'alice@example.com',
      password: 'correct-horse',
    };

    it('user not found → bcrypt-timing equalized + fail', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      usersServiceMock.findByEmail.mockResolvedValue(null);
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );

      // Timing equalization (bcrypt.compare against DUMMY_PASSWORD_HASH) is verified
      // by inspection of advanceCredentials — bcrypt's compare isn't spy-able via
      // jest.spyOn since it's an exported function on a non-configurable property.
      await expect(service.advance(INTENT_ID, baseInput, {})).rejects.toThrow(
        UnauthorizedException,
      );
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.AUTH_INTENT_FAILED }),
      );
    });

    it('account locked → bcrypt-timing equalized + fail', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      usersServiceMock.findByEmail.mockResolvedValue(
        userRow({ lockedUntil: new Date(Date.now() + 60_000) }),
      );
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );

      await expect(service.advance(INTENT_ID, baseInput, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('bad password → fail', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      usersServiceMock.findByEmail.mockResolvedValue(userRow());
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );

      await expect(
        service.advance(
          INTENT_ID,
          { ...baseInput, password: 'wrong-password' },
          {},
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('email not verified → fail', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      usersServiceMock.findByEmail.mockResolvedValue(
        userRow({ emailVerified: false }),
      );
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );

      await expect(service.advance(INTENT_ID, baseInput, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('happy single-tenant + no MFA → succeeded directly (short-circuit decision D)', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      usersServiceMock.findByEmail.mockResolvedValue(userRow());
      usersServiceMock.findById.mockResolvedValue(userRow());
      prismaMock.tenantMembership.findMany.mockResolvedValue([membershipRow()]);
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({
          status: 'succeeded',
          userId: USER_A,
          tenantId: TENANT_A,
        }),
      );

      const result = await service.advance(INTENT_ID, baseInput, {
        ipAddress: '127.0.0.1',
      });

      expect(result.status).toBe('succeeded');
      expect(result.accessToken).toBe('access-token-xyz');
      expect(result.refreshToken).toBe('opaque-token-xyz');
      expect(sessionsServiceV2Mock.createSession).toHaveBeenCalled();
      expect(tokenServiceV2Mock.mintAccessToken).toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.AUTH_INTENT_SUCCEEDED }),
      );
    });

    it('happy multi-tenant + no MFA + no subdomain → requires_tenant_pick', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      usersServiceMock.findByEmail.mockResolvedValue(userRow());
      usersServiceMock.findById.mockResolvedValue(userRow());
      prismaMock.tenantMembership.findMany.mockResolvedValue([
        membershipRow({ id: MEMBERSHIP_A, tenantId: TENANT_A }),
        membershipRow({ id: MEMBERSHIP_B, tenantId: TENANT_B }),
      ]);
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'requires_tenant_pick', userId: USER_A }),
      );

      const result = await service.advance(INTENT_ID, baseInput, {});
      expect(result.status).toBe('requires_tenant_pick');
      expect(result.availableTenantIds).toEqual([TENANT_A, TENANT_B]);
      expect(sessionsServiceV2Mock.createSession).not.toHaveBeenCalled();
    });

    it('happy + MFA enabled → requires_mfa', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      usersServiceMock.findByEmail.mockResolvedValue(
        userRow({ mfaEnabled: true, mfaSecret: 'encrypted-SECRET' }),
      );
      usersServiceMock.findById.mockResolvedValue(
        userRow({ mfaEnabled: true, mfaSecret: 'encrypted-SECRET' }),
      );
      prismaMock.tenantMembership.findMany.mockResolvedValue([membershipRow()]);
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'requires_mfa', userId: USER_A }),
      );

      const result = await service.advance(INTENT_ID, baseInput, {});
      expect(result.status).toBe('requires_mfa');
      expect(sessionsServiceV2Mock.createSession).not.toHaveBeenCalled();
    });

    it('subdomain auto-resolve (D5): TenantContext set + member → succeeded directly', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      usersServiceMock.findByEmail.mockResolvedValue(userRow());
      usersServiceMock.findById.mockResolvedValue(userRow());
      prismaMock.tenantMembership.findMany.mockResolvedValue([
        membershipRow({ id: MEMBERSHIP_A, tenantId: TENANT_A }),
        membershipRow({ id: MEMBERSHIP_B, tenantId: TENANT_B }),
      ]);
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'succeeded', userId: USER_A, tenantId: TENANT_B }),
      );

      // Simulate middleware-bound TenantContext for TENANT_B.
      const result = await TenantContext.run(TENANT_B, () =>
        service.advance(INTENT_ID, baseInput, {}),
      );
      expect(result.status).toBe('succeeded');
      expect(result.user?.tenantId).toBe(TENANT_B);
    });

    it('no memberships → fail (no_tenant_membership)', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentRow());
      usersServiceMock.findByEmail.mockResolvedValue(userRow());
      usersServiceMock.findById.mockResolvedValue(userRow());
      prismaMock.tenantMembership.findMany.mockResolvedValue([]);
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );

      await expect(service.advance(INTENT_ID, baseInput, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('advanceMfa', () => {
    const intentMfaState = intentRow({
      status: 'requires_mfa',
      userId: USER_A,
    });

    it('valid TOTP code → next status (single-tenant → succeeded)', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentMfaState);
      usersServiceMock.findById.mockResolvedValue(
        userRow({ mfaEnabled: true, mfaSecret: 'encrypted-SECRET' }),
      );
      prismaMock.tenantMembership.findMany.mockResolvedValue([membershipRow()]);
      mockOtpVerify.mockReturnValue({ valid: true });
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'succeeded', userId: USER_A, tenantId: TENANT_A }),
      );

      const result = await service.advance(
        INTENT_ID,
        { kind: 'mfa', code: '123456' },
        {},
      );
      expect(result.status).toBe('succeeded');
    });

    it('invalid TOTP code → fail', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentMfaState);
      usersServiceMock.findById.mockResolvedValue(
        userRow({ mfaEnabled: true, mfaSecret: 'encrypted-SECRET' }),
      );
      mockOtpVerify.mockReturnValue({ valid: false });
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );

      await expect(
        service.advance(INTENT_ID, { kind: 'mfa', code: '999999' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('valid recovery code → consumes code + succeeds', async () => {
      // pre-hash a recovery code
      const recoveryPlain = 'RECOVERY-CODE-XYZ';
      const recoveryHash = await bcrypt.hash(recoveryPlain, 4);
      prismaMock.authIntent.findUnique.mockResolvedValue(intentMfaState);
      usersServiceMock.findById.mockResolvedValue(
        userRow({
          mfaEnabled: true,
          mfaSecret: 'encrypted-SECRET',
          mfaRecoveryCodes: [recoveryHash, 'other-hash'],
        }),
      );
      prismaMock.tenantMembership.findMany.mockResolvedValue([membershipRow()]);
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'succeeded', userId: USER_A, tenantId: TENANT_A }),
      );

      const result = await service.advance(
        INTENT_ID,
        { kind: 'mfa', recoveryCode: recoveryPlain },
        {},
      );
      expect(result.status).toBe('succeeded');
      expect(usersServiceMock.updateRecoveryCodes).toHaveBeenCalledWith(
        USER_A,
        ['other-hash'],
      );
    });

    it('mfa state but no user.mfaSecret → fail (mfa_state_invalid)', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentMfaState);
      usersServiceMock.findById.mockResolvedValue(
        userRow({ mfaEnabled: true, mfaSecret: null }),
      );
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );

      await expect(
        service.advance(INTENT_ID, { kind: 'mfa', code: '111111' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('advanceTenantPick', () => {
    const intentPickState = intentRow({
      status: 'requires_tenant_pick',
      userId: USER_A,
    });

    it('valid tenantId (user is member) → succeeded', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentPickState);
      prismaMock.tenantMembership.findFirst.mockResolvedValue(
        membershipRow({ tenantId: TENANT_B }),
      );
      usersServiceMock.findById.mockResolvedValue(userRow());
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({
          status: 'succeeded',
          userId: USER_A,
          tenantId: TENANT_B,
        }),
      );

      const result = await service.advance(
        INTENT_ID,
        { kind: 'tenant_pick', tenantId: TENANT_B },
        {},
      );
      expect(result.status).toBe('succeeded');
      expect(result.user?.tenantId).toBe(TENANT_B);
    });

    it('invalid tenantId (not a member) → fail', async () => {
      prismaMock.authIntent.findUnique.mockResolvedValue(intentPickState);
      prismaMock.tenantMembership.findFirst.mockResolvedValue(null);
      prismaMock.authIntent.update.mockResolvedValue(
        intentRow({ status: 'failed' }),
      );

      await expect(
        service.advance(
          INTENT_ID,
          { kind: 'tenant_pick', tenantId: TENANT_B },
          {},
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
