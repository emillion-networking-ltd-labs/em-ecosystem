import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { MembershipStatus, TenantRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { ErrorMessages } from '../../common/constants/error-messages';
import { TenantContext } from '../../common/context/tenant-context';
import { SessionsServiceV2 } from '../sessions.service.v2';

/**
 * SessionsServiceV2 spec — SCRUM-493 / AUTH v2 + Tenancy v1 Phase 1.2.
 *
 * Real SessionsServiceV2 + mocked PrismaService + spy AuditService + real
 * ConfigService (mock get). Same idiom as SCRUM-491's tenants.integration.spec.ts.
 * Atomicity-of-intent verified via mock call-order assertions (not real-DB
 * atomicity — flagged as documented limitation in /verify).
 */

const USER_A = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';
const USER_B = 'bbbb2222-bbbb-2222-bbbb-bbbb22222222';
const TENANT_A = 'cccc3333-cccc-3333-cccc-cccc33333333';
const TENANT_B = 'dddd4444-dddd-4444-dddd-dddd44444444';

function baseSessionRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: 'sess-aaaaaaaa-aaaaaaaa',
    userId: USER_A,
    tenantId: TENANT_A,
    refreshTokenHash: 'hash-placeholder',
    isRevoked: false,
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000), // +12h
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<Parameters<SessionsServiceV2['createSession']>[0]> = {},
) {
  return {
    userId: USER_A,
    tenantId: TENANT_A,
    tenantRole: TenantRole.MEMBER,
    isPlatformAdmin: false,
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    ...overrides,
  };
}

describe('SessionsServiceV2', () => {
  let service: SessionsServiceV2;
  let prismaMock: {
    sessionV2: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    tenantMembership: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let auditLog: jest.Mock;

  beforeEach(async () => {
    prismaMock = {
      sessionV2: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      tenantMembership: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn(async (cb: (tx: typeof prismaMock) => unknown) =>
        cb(prismaMock),
      ),
    };
    auditLog = jest.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsServiceV2,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: auditLog } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('12h') },
        },
      ],
    }).compile();

    service = moduleRef.get(SessionsServiceV2);
  });

  describe('createSession', () => {
    it('mints with all input fields, returns plaintext + sessionId + expiresAt', async () => {
      prismaMock.sessionV2.create.mockImplementation(({ data }) =>
        Promise.resolve(baseSessionRow({ ...data, id: 'sess-new' })),
      );

      const result = await service.createSession(baseInput());

      expect(result.sessionId).toBe('sess-new');
      // base64url of 32 bytes = 43 chars (no padding)
      expect(result.refreshToken).toHaveLength(43);
      expect(result.refreshToken).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(result.expiresAt).toBeInstanceOf(Date);

      expect(prismaMock.sessionV2.create).toHaveBeenCalledTimes(1);
      const createArgs = prismaMock.sessionV2.create.mock.calls[0][0];
      expect(createArgs.data.userId).toBe(USER_A);
      expect(createArgs.data.tenantId).toBe(TENANT_A);
      expect(createArgs.data.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
      expect(createArgs.data.ipAddress).toBe('127.0.0.1');
      expect(createArgs.data.userAgent).toBe('jest');

      expect(auditLog).toHaveBeenCalledTimes(1);
      const auditCall = auditLog.mock.calls[0][0];
      expect(auditCall.action).toBe(AuditAction.SESSION_V2_CREATED);
      expect(auditCall.userId).toBe(USER_A);
      expect(auditCall.metadata).toMatchObject({
        sessionId: 'sess-new',
        tenantId: TENANT_A,
        tenantRole: TenantRole.MEMBER,
        isPlatformAdmin: false,
      });
    });

    it('two consecutive mints produce different refresh tokens (and hashes)', async () => {
      prismaMock.sessionV2.create.mockImplementation(({ data }) =>
        Promise.resolve(
          baseSessionRow({ ...data, id: `sess-${Math.random()}` }),
        ),
      );

      const a = await service.createSession(baseInput());
      const b = await service.createSession(baseInput());

      expect(a.refreshToken).not.toBe(b.refreshToken);
      const hashA =
        prismaMock.sessionV2.create.mock.calls[0][0].data.refreshTokenHash;
      const hashB =
        prismaMock.sessionV2.create.mock.calls[1][0].data.refreshTokenHash;
      expect(hashA).not.toBe(hashB);
    });

    it('expiresAt is now + 12h (within ±2s tolerance)', async () => {
      prismaMock.sessionV2.create.mockImplementation(({ data }) =>
        Promise.resolve(baseSessionRow({ ...data, id: 'sess-x' })),
      );

      const result = await service.createSession(baseInput());

      const expected = Date.now() + 12 * 60 * 60 * 1000;
      const delta = Math.abs(result.expiresAt.getTime() - expected);
      expect(delta).toBeLessThanOrEqual(2000);
    });
  });

  describe('validateAndRotate — happy path', () => {
    beforeEach(() => {
      prismaMock.sessionV2.findUnique.mockResolvedValue(baseSessionRow());
      prismaMock.tenantMembership.findUnique.mockResolvedValue({
        role: TenantRole.ADMIN,
      });
      prismaMock.user.findUnique.mockResolvedValue({
        isPlatformAdmin: true,
      });
      prismaMock.sessionV2.update.mockResolvedValue(
        baseSessionRow({ isRevoked: true }),
      );
      prismaMock.sessionV2.create.mockImplementation(({ data }) =>
        Promise.resolve(baseSessionRow({ ...data, id: 'sess-rotated' })),
      );
    });

    it('returns RotateResult with new plaintext + tenantRole + isPlatformAdmin from canonical sources', async () => {
      const result = await service.validateAndRotate('any-plaintext');

      expect(result.sessionId).toBe('sess-rotated');
      expect(result.refreshToken).toHaveLength(43);
      expect(result.userId).toBe(USER_A);
      expect(result.tenantId).toBe(TENANT_A);
      expect(result.tenantRole).toBe(TenantRole.ADMIN);
      expect(result.isPlatformAdmin).toBe(true);
    });

    it('rotation is wrapped in $transaction (one tx for revoke-old + create-new)', async () => {
      await service.validateAndRotate('any-plaintext');

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      // Within the transaction, update (revoke) must be called BEFORE create.
      const updateOrder =
        prismaMock.sessionV2.update.mock.invocationCallOrder[0];
      const createOrder =
        prismaMock.sessionV2.create.mock.invocationCallOrder[0];
      expect(updateOrder).toBeLessThan(createOrder);
    });

    it('emits SESSION_V2_ROTATED with oldSessionId + newSessionId + tenantId', async () => {
      await service.validateAndRotate('any-plaintext');

      const rotatedCall = auditLog.mock.calls.find(
        (c) => c[0].action === AuditAction.SESSION_V2_ROTATED,
      );
      expect(rotatedCall).toBeDefined();
      expect(rotatedCall![0].metadata).toMatchObject({
        oldSessionId: 'sess-aaaaaaaa-aaaaaaaa',
        newSessionId: 'sess-rotated',
        tenantId: TENANT_A,
      });
    });

    it('initial lookup runs inside TenantContext.runWithBypass (cross-tenant scope)', async () => {
      let observedReason: string | null = null;
      prismaMock.sessionV2.findUnique.mockImplementation(() => {
        observedReason = TenantContext.getBypassReason();
        return Promise.resolve(baseSessionRow());
      });

      await service.validateAndRotate('any-plaintext');

      expect(observedReason).toBe('session-v2-refresh-lookup');
    });

    it('rotation runs inside TenantContext.run(session.tenantId)', async () => {
      let observedTenant: string | null = null;
      prismaMock.sessionV2.update.mockImplementation(() => {
        observedTenant = TenantContext.getActiveTenantId();
        return Promise.resolve(baseSessionRow({ isRevoked: true }));
      });

      await service.validateAndRotate('any-plaintext');

      expect(observedTenant).toBe(TENANT_A);
    });
  });

  describe('validateAndRotate — rejection paths (no failure-mode enumeration)', () => {
    function assertSameException(err: unknown) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).message).toBe(
        ErrorMessages.auth.AUTHENTICATION_FAILED,
      );
    }

    it('rejects when token hash is not found (reasonClass=not-found)', async () => {
      prismaMock.sessionV2.findUnique.mockResolvedValue(null);

      await expect(service.validateAndRotate('x')).rejects.toThrow(
        UnauthorizedException,
      );
      try {
        await service.validateAndRotate('x');
      } catch (e) {
        assertSameException(e);
      }
      const rejectCall = auditLog.mock.calls.find(
        (c) => c[0].action === AuditAction.SESSION_V2_REFRESH_REJECTED,
      );
      expect(rejectCall![0].metadata.reasonClass).toBe('not-found');
      expect(rejectCall![0].userId).toBeNull();
    });

    it('rejects when session is already revoked (reasonClass=revoked)', async () => {
      prismaMock.sessionV2.findUnique.mockResolvedValue(
        baseSessionRow({ isRevoked: true }),
      );

      try {
        await service.validateAndRotate('x');
        fail('expected throw');
      } catch (e) {
        assertSameException(e);
      }
      const rejectCall = auditLog.mock.calls.find(
        (c) => c[0].action === AuditAction.SESSION_V2_REFRESH_REJECTED,
      );
      expect(rejectCall![0].metadata.reasonClass).toBe('revoked');
      expect(rejectCall![0].userId).toBe(USER_A);
    });

    it('rejects when session is expired (reasonClass=expired)', async () => {
      prismaMock.sessionV2.findUnique.mockResolvedValue(
        baseSessionRow({ expiresAt: new Date(Date.now() - 1000) }),
      );

      try {
        await service.validateAndRotate('x');
        fail('expected throw');
      } catch (e) {
        assertSameException(e);
      }
      const rejectCall = auditLog.mock.calls.find(
        (c) => c[0].action === AuditAction.SESSION_V2_REFRESH_REJECTED,
      );
      expect(rejectCall![0].metadata.reasonClass).toBe('expired');
    });

    it('rejects when membership lookup returns null (reasonClass=membership-stale)', async () => {
      prismaMock.sessionV2.findUnique.mockResolvedValue(baseSessionRow());
      prismaMock.tenantMembership.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue({ isPlatformAdmin: false });

      try {
        await service.validateAndRotate('x');
        fail('expected throw');
      } catch (e) {
        assertSameException(e);
      }
      const rejectCall = auditLog.mock.calls.find(
        (c) => c[0].action === AuditAction.SESSION_V2_REFRESH_REJECTED,
      );
      expect(rejectCall![0].metadata.reasonClass).toBe('membership-stale');
    });

    it('exception message is bit-identical across all rejection paths', async () => {
      const messages: string[] = [];

      const cases: Array<() => void> = [
        () => prismaMock.sessionV2.findUnique.mockResolvedValue(null),
        () =>
          prismaMock.sessionV2.findUnique.mockResolvedValue(
            baseSessionRow({ isRevoked: true }),
          ),
        () =>
          prismaMock.sessionV2.findUnique.mockResolvedValue(
            baseSessionRow({ expiresAt: new Date(Date.now() - 1000) }),
          ),
      ];

      for (const setup of cases) {
        auditLog.mockClear();
        setup();
        try {
          await service.validateAndRotate('x');
        } catch (e) {
          messages.push((e as UnauthorizedException).message);
        }
      }

      expect(messages).toHaveLength(3);
      expect(new Set(messages).size).toBe(1);
      expect(messages[0]).toBe(ErrorMessages.auth.AUTHENTICATION_FAILED);
    });
  });

  describe('revokeSession', () => {
    it('updates isRevoked=true + emits SESSION_V2_REVOKED', async () => {
      prismaMock.sessionV2.update.mockResolvedValue(
        baseSessionRow({ isRevoked: true }),
      );

      await service.revokeSession('sess-id');

      expect(prismaMock.sessionV2.update).toHaveBeenCalledWith({
        where: { id: 'sess-id' },
        data: { isRevoked: true },
      });
      const revokedCall = auditLog.mock.calls.find(
        (c) => c[0].action === AuditAction.SESSION_V2_REVOKED,
      );
      expect(revokedCall![0].metadata.sessionId).toBe('sess-id');
    });

    it('swallows P2025 (record not found) silently — no throw, no audit emission', async () => {
      const p2025 = Object.assign(new Error('not found'), { code: 'P2025' });
      prismaMock.sessionV2.update.mockRejectedValue(p2025);

      await expect(service.revokeSession('missing')).resolves.toBeUndefined();
      expect(auditLog).not.toHaveBeenCalled();
    });
  });

  describe('revokeAllForTenant', () => {
    it('scopes the bulk revoke to (userId, tenantId) and returns revokedCount', async () => {
      prismaMock.sessionV2.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.revokeAllForTenant(USER_A, TENANT_A);

      expect(prismaMock.sessionV2.updateMany).toHaveBeenCalledWith({
        where: { userId: USER_A, tenantId: TENANT_A, isRevoked: false },
        data: { isRevoked: true },
      });
      expect(result).toEqual({ revokedCount: 3 });

      const auditCall = auditLog.mock.calls.find(
        (c) => c[0].action === AuditAction.SESSION_V2_TENANT_BULK_REVOKED,
      );
      expect(auditCall![0].metadata).toEqual({
        userId: USER_A,
        tenantId: TENANT_A,
        revokedCount: 3,
      });
    });

    it('emits the audit row even when zero sessions matched', async () => {
      prismaMock.sessionV2.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.revokeAllForTenant(USER_B, TENANT_B);

      expect(result.revokedCount).toBe(0);
      const auditCall = auditLog.mock.calls.find(
        (c) => c[0].action === AuditAction.SESSION_V2_TENANT_BULK_REVOKED,
      );
      expect(auditCall![0].metadata.revokedCount).toBe(0);
    });
  });

  // Reference the MembershipStatus enum import so it is exercised — keeps
  // the import meaningful (canonical re-export of @prisma/client enums used
  // in the broader v2 surface; future Phase 1.3 specs will use it for filtering).
  describe('test-fixture sanity', () => {
    it('MembershipStatus enum is importable from @prisma/client', () => {
      expect(MembershipStatus.active).toBe('active');
    });
  });
});
