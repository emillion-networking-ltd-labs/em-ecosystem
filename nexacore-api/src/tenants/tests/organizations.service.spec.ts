import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationRole, Prisma } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { ErrorMessages } from '../../common/constants/error-messages';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationsService } from '../organizations.service';

/**
 * OrganizationsService spec — SCRUM-495 / AUTH v2 + Tenancy v1 Phase 2.1.
 *
 * Real OrganizationsService + mocked PrismaService + spy AuditService. Mirrors
 * the SCRUM-491 / SCRUM-493 integration-spec idiom.
 */

const TENANT_A = 'cccc3333-cccc-3333-cccc-cccc33333333';
const TENANT_B = 'dddd4444-dddd-4444-dddd-dddd44444444';
const ORG_A = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';
const USER_A = 'bbbb2222-bbbb-2222-bbbb-bbbb22222222';
const USER_B = 'cccc3333-cccc-cccc-cccc-cccccccccccc';

function baseOrgRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: ORG_A,
    tenantId: TENANT_A,
    name: 'Engineering',
    slug: 'engineering',
    description: null as string | null,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prismaMock: {
    organization: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
    };
    organizationMembership: {
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };
  let auditLog: jest.Mock;

  beforeEach(async () => {
    prismaMock = {
      organization: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      organizationMembership: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    auditLog = jest.fn();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { log: auditLog } },
      ],
    }).compile();
    service = moduleRef.get(OrganizationsService);
  });

  describe('findById', () => {
    it('returns the org when tenantId matches', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(baseOrgRow());
      const result = await service.findById(ORG_A, TENANT_A);
      expect(result?.id).toBe(ORG_A);
    });

    it('returns null when the org belongs to a different tenant', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(
        baseOrgRow({ tenantId: TENANT_B }),
      );
      const result = await service.findById(ORG_A, TENANT_A);
      expect(result).toBeNull();
    });

    it('returns null when org not found', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);
      const result = await service.findById(ORG_A, TENANT_A);
      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('uses the composite tenantId_slug unique key', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(baseOrgRow());
      await service.findBySlug(TENANT_A, 'engineering');
      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { tenantId_slug: { tenantId: TENANT_A, slug: 'engineering' } },
      });
    });
  });

  describe('listForTenant', () => {
    it('orders by createdAt ASC', async () => {
      prismaMock.organization.findMany.mockResolvedValue([baseOrgRow()]);
      await service.listForTenant(TENANT_A);
      expect(prismaMock.organization.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT_A },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('creates an org + emits ORGANIZATION_CREATED audit', async () => {
      prismaMock.organization.create.mockResolvedValue(
        baseOrgRow({ id: 'org-new' }),
      );

      const result = await service.create(
        TENANT_A,
        { name: 'Engineering', slug: 'engineering' },
        USER_A,
      );

      expect(result.id).toBe('org-new');
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ORGANIZATION_CREATED,
          userId: USER_A,
          metadata: expect.objectContaining({
            organizationId: 'org-new',
            tenantId: TENANT_A,
            slug: 'engineering',
          }),
        }),
      );
    });

    it('translates P2002 to ConflictException with SLUG_TAKEN message', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '0.0.0' },
      );
      prismaMock.organization.create.mockRejectedValue(p2002);

      await expect(
        service.create(TENANT_A, { name: 'X', slug: 'engineering' }, USER_A),
      ).rejects.toThrow(ConflictException);
      try {
        await service.create(
          TENANT_A,
          { name: 'X', slug: 'engineering' },
          USER_A,
        );
      } catch (e) {
        expect((e as ConflictException).message).toBe(
          ErrorMessages.organizations.SLUG_TAKEN,
        );
      }
      // Audit not emitted on failure
      expect(auditLog).not.toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    it('inserts membership + emits ORGANIZATION_MEMBER_ADDED', async () => {
      prismaMock.organizationMembership.create.mockResolvedValue({
        id: 'om-1',
        organizationId: ORG_A,
        userId: USER_B,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date(),
      });

      await service.addMember(ORG_A, USER_B, OrganizationRole.MEMBER, USER_A);

      expect(prismaMock.organizationMembership.create).toHaveBeenCalledWith({
        data: {
          organizationId: ORG_A,
          userId: USER_B,
          role: OrganizationRole.MEMBER,
        },
      });
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ORGANIZATION_MEMBER_ADDED,
          userId: USER_A,
          targetUserId: USER_B,
          metadata: expect.objectContaining({
            organizationId: ORG_A,
            role: OrganizationRole.MEMBER,
          }),
        }),
      );
    });

    it('translates P2002 to ConflictException with MEMBER_EXISTS', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '0.0.0',
      });
      prismaMock.organizationMembership.create.mockRejectedValue(p2002);
      await expect(
        service.addMember(ORG_A, USER_B, OrganizationRole.MEMBER, USER_A),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('deletes membership + emits ORGANIZATION_MEMBER_REMOVED', async () => {
      prismaMock.organizationMembership.delete.mockResolvedValue({});
      await service.removeMember(ORG_A, USER_B, USER_A);
      expect(prismaMock.organizationMembership.delete).toHaveBeenCalled();
      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ORGANIZATION_MEMBER_REMOVED,
          userId: USER_A,
          targetUserId: USER_B,
        }),
      );
    });

    it('swallows P2025 silently (idempotent remove)', async () => {
      const p2025 = Object.assign(new Error('not found'), { code: 'P2025' });
      prismaMock.organizationMembership.delete.mockRejectedValue(p2025);
      await expect(
        service.removeMember(ORG_A, USER_B, USER_A),
      ).resolves.toBeUndefined();
      expect(auditLog).not.toHaveBeenCalled();
    });
  });

  describe('requireMembership', () => {
    it('returns null for platform admins (short-circuit)', async () => {
      const result = await service.requireMembership(ORG_A, USER_B, true);
      expect(result).toBeNull();
      expect(
        prismaMock.organizationMembership.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('returns the membership when found', async () => {
      const m = {
        id: 'om-1',
        organizationId: ORG_A,
        userId: USER_B,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date(),
      };
      prismaMock.organizationMembership.findUnique.mockResolvedValue(m);
      const result = await service.requireMembership(ORG_A, USER_B, false);
      expect(result).toEqual(m);
    });

    it('throws NotFoundException (404 not 403) when not a member', async () => {
      prismaMock.organizationMembership.findUnique.mockResolvedValue(null);
      try {
        await service.requireMembership(ORG_A, USER_B, false);
        fail('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect((e as NotFoundException).message).toBe(
          ErrorMessages.organizations.NOT_FOUND,
        );
      }
    });
  });
});
