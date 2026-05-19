/**
 * TenantsController integration spec — wires real Controller + real Services
 * with a mocked PrismaService + spy AuditService. Exercises the controller →
 * services → "DB" chain end-to-end without standing up Postgres.
 *
 * SCRUM-491 / AUTH v2 + Tenancy v1 — Phase 0.4.
 */

import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus, Prisma, TenantRole } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../users/enums/role.enum';
import { InvitationsService } from '../invitations.service';
import { MembershipsService } from '../memberships.service';
import { TenantsController } from '../tenants.controller';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_INVITER = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';
const USER_INVITEE = 'bbbb2222-bbbb-2222-bbbb-bbbb22222222';
const INVITEE_EMAIL = 'invitee@example.com';

function reqOwner(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    user: {
      id: overrides.id ?? USER_INVITER,
      email: overrides.email ?? 'owner@example.com',
      role: Role.USER,
      isPlatformAdmin: false,
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'jest' },
  };
}

describe('TenantsController integration (controller + real services + mock Prisma)', () => {
  let controller: TenantsController;
  let prisma: {
    tenantInvitation: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    tenantMembership: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      upsert: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      tenantInvitation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      tenantMembership: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: typeof prisma) => unknown) =>
        cb(prisma),
      ),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        InvitationsService,
        MembershipsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  describe('cross-tenant denial returns 404 (NOT 403)', () => {
    it('non-member listMembers → NotFoundException', async () => {
      prisma.tenantMembership.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.listMembers(TENANT_A, reqOwner()),
      ).rejects.toThrow(NotFoundException);
    });

    it('non-member createInvitation → NotFoundException', async () => {
      prisma.tenantMembership.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.createInvitation(
          TENANT_A,
          { email: INVITEE_EMAIL, role: TenantRole.MEMBER },
          reqOwner(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('MEMBER role attempting createInvitation → NotFoundException (not 403, hides role-set)', async () => {
      prisma.tenantMembership.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        tenantId: TENANT_A,
        userId: USER_INVITER,
        role: TenantRole.MEMBER,
        status: MembershipStatus.active,
      });

      await expect(
        controller.createInvitation(
          TENANT_A,
          { email: INVITEE_EMAIL, role: TenantRole.MEMBER },
          reqOwner(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('OWNER createInvitation happy path', () => {
    it('returns plaintext token on fresh create', async () => {
      prisma.tenantMembership.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        tenantId: TENANT_A,
        userId: USER_INVITER,
        role: TenantRole.OWNER,
        status: MembershipStatus.active,
      });
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce(null);
      prisma.tenantInvitation.create.mockResolvedValueOnce({
        id: 'inv-1',
        tenantId: TENANT_A,
        email: INVITEE_EMAIL,
        role: TenantRole.MEMBER,
        tokenHash: 'h',
        invitedBy: USER_INVITER,
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.createInvitation(
        TENANT_A,
        { email: INVITEE_EMAIL, role: TenantRole.MEMBER },
        reqOwner(),
      );

      expect(result.token).toBeTruthy();
      expect(typeof result.token).toBe('string');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TENANT_INVITATION_CREATED,
        }),
      );
    });
  });

  describe('platform-admin bypass', () => {
    it('isPlatformAdmin=true skips membership check on revokeInvitation', async () => {
      // No membership mock — if the path tried to check it would throw 404.
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-1',
        tenantId: TENANT_A,
        email: INVITEE_EMAIL,
        role: TenantRole.MEMBER,
        tokenHash: 'h',
        invitedBy: 'someone-else',
        expiresAt: new Date(Date.now() + 86_400_000),
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.tenantInvitation.delete.mockResolvedValueOnce(undefined);

      const platformAdminReq = {
        user: {
          id: 'platform-admin-1',
          email: 'admin@platform.com',
          role: Role.SUPERADMIN,
          isPlatformAdmin: true,
        },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };

      await expect(
        controller.revokeInvitation(
          TENANT_A,
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          platformAdminReq,
        ),
      ).resolves.toBeUndefined();

      // Membership check NOT called (bypassed by platform-admin short-circuit)
      expect(prisma.tenantMembership.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('acceptInvitation full flow (no controller-side membership check)', () => {
    const TOKEN = 'a'.repeat(43);
    const TOKEN_HASH = createHash('sha256').update(TOKEN).digest('hex');

    it('expired invitation → 410 + EXPIRE_REJECTED audit', async () => {
      prisma.tenantInvitation.findUnique.mockResolvedValueOnce({
        id: 'inv-exp',
        tenantId: TENANT_A,
        email: INVITEE_EMAIL,
        role: TenantRole.MEMBER,
        tokenHash: TOKEN_HASH,
        invitedBy: USER_INVITER,
        expiresAt: new Date(Date.now() - 1000),
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        controller.acceptInvitation(
          { token: TOKEN },
          {
            user: {
              id: USER_INVITEE,
              email: INVITEE_EMAIL,
              role: Role.USER,
              isPlatformAdmin: false,
            },
            ip: '127.0.0.1',
            headers: { 'user-agent': 'jest' },
          },
        ),
      ).rejects.toThrow(GoneException);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TENANT_INVITATION_EXPIRE_REJECTED,
        }),
      );
    });

    it('email mismatch → 403 + MISMATCH audit', async () => {
      prisma.tenantInvitation.findUnique.mockResolvedValueOnce({
        id: 'inv-mm',
        tenantId: TENANT_A,
        email: INVITEE_EMAIL,
        role: TenantRole.MEMBER,
        tokenHash: TOKEN_HASH,
        invitedBy: USER_INVITER,
        expiresAt: new Date(Date.now() + 86_400_000),
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        controller.acceptInvitation(
          { token: TOKEN },
          {
            user: {
              id: USER_INVITEE,
              email: 'wrong@example.com',
              role: Role.USER,
              isPlatformAdmin: false,
            },
            ip: '127.0.0.1',
            headers: { 'user-agent': 'jest' },
          },
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.TENANT_INVITATION_EMAIL_MISMATCH_REJECTED,
        }),
      );
    });
  });

  describe('createInvitation race recovery (P2002)', () => {
    it('catches unique-violation and returns the raced-existing row', async () => {
      prisma.tenantMembership.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        tenantId: TENANT_A,
        userId: USER_INVITER,
        role: TenantRole.OWNER,
        status: MembershipStatus.active,
      });
      // Pre-create check: nothing
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce(null);
      // Create throws P2002
      prisma.tenantInvitation.create.mockImplementationOnce(() => {
        throw new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        });
      });
      // Recovery findFirst sees the raced row
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-raced',
        tenantId: TENANT_A,
        email: INVITEE_EMAIL,
        role: TenantRole.MEMBER,
        tokenHash: 'h',
        invitedBy: 'concurrent-caller',
        expiresAt: new Date(Date.now() + 86_400_000),
        acceptedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.createInvitation(
        TENANT_A,
        { email: INVITEE_EMAIL, role: TenantRole.MEMBER },
        reqOwner(),
      );

      expect(result.id).toBe('inv-raced');
      expect(result.token).toBeNull();
    });
  });

  describe('revokeInvitation on already-accepted', () => {
    it('throws ConflictException without deleting', async () => {
      prisma.tenantMembership.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        tenantId: TENANT_A,
        userId: USER_INVITER,
        role: TenantRole.OWNER,
        status: MembershipStatus.active,
      });
      prisma.tenantInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-acc',
        tenantId: TENANT_A,
        email: INVITEE_EMAIL,
        role: TenantRole.MEMBER,
        tokenHash: 'h',
        invitedBy: USER_INVITER,
        expiresAt: new Date(Date.now() + 86_400_000),
        acceptedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        controller.revokeInvitation(
          TENANT_A,
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          reqOwner(),
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.tenantInvitation.delete).not.toHaveBeenCalled();
    });
  });
});
