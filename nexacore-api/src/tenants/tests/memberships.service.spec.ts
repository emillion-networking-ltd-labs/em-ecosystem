import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MembershipStatus, TenantRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipsService } from '../memberships.service';

const TENANT_A = 't-a';
const USER_A = 'u-a';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let prisma: {
    tenantMembership: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      tenantMembership: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<MembershipsService>(MembershipsService);
  });

  describe('requireMembership', () => {
    it('returns null for platform admins without querying', async () => {
      const result = await service.requireMembership(TENANT_A, USER_A, true);
      expect(result).toBeNull();
      expect(prisma.tenantMembership.findUnique).not.toHaveBeenCalled();
    });

    it('returns the membership for an active member', async () => {
      const membership = {
        id: 'm-1',
        tenantId: TENANT_A,
        userId: USER_A,
        role: TenantRole.MEMBER,
        status: MembershipStatus.active,
      };
      prisma.tenantMembership.findUnique.mockResolvedValueOnce(membership);

      const result = await service.requireMembership(TENANT_A, USER_A, false);
      expect(result).toEqual(membership);
    });

    it('throws NotFoundException when caller is not a member', async () => {
      prisma.tenantMembership.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.requireMembership(TENANT_A, USER_A, false),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when membership is suspended', async () => {
      prisma.tenantMembership.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        role: TenantRole.MEMBER,
        status: MembershipStatus.suspended,
      });
      await expect(
        service.requireMembership(TENANT_A, USER_A, false),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('requireTenantRole', () => {
    it('bypasses for platform admins', async () => {
      const result = await service.requireTenantRole(
        TENANT_A,
        USER_A,
        [TenantRole.OWNER],
        true,
      );
      expect(result).toBeNull();
      expect(prisma.tenantMembership.findUnique).not.toHaveBeenCalled();
    });

    it('returns the membership when role is in allowed set', async () => {
      const membership = {
        id: 'm-1',
        role: TenantRole.ADMIN,
        status: MembershipStatus.active,
      };
      prisma.tenantMembership.findUnique.mockResolvedValueOnce(membership);

      const result = await service.requireTenantRole(
        TENANT_A,
        USER_A,
        [TenantRole.OWNER, TenantRole.ADMIN],
        false,
      );
      expect(result).toEqual(membership);
    });

    it('throws NotFoundException (not Forbidden) when role is wrong', async () => {
      prisma.tenantMembership.findUnique.mockResolvedValueOnce({
        id: 'm-1',
        role: TenantRole.MEMBER,
        status: MembershipStatus.active,
      });

      await expect(
        service.requireTenantRole(
          TENANT_A,
          USER_A,
          [TenantRole.OWNER, TenantRole.ADMIN],
          false,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listMembers', () => {
    const rows = [
      {
        userId: 'u-1',
        role: TenantRole.OWNER,
        status: MembershipStatus.active,
        joinedAt: new Date('2026-01-01'),
        lastActiveAt: new Date('2026-05-01'),
        user: { email: 'owner@acme.com' },
      },
      {
        userId: 'u-2',
        role: TenantRole.MEMBER,
        status: MembershipStatus.active,
        joinedAt: new Date('2026-02-01'),
        lastActiveAt: new Date('2026-05-02'),
        user: { email: 'member@acme.com' },
      },
    ];

    it('returns paginated data with totals', async () => {
      prisma.tenantMembership.findMany.mockResolvedValueOnce(rows);
      prisma.tenantMembership.count.mockResolvedValueOnce(2);

      const result = await service.listMembers(TENANT_A, 1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.data[0].email).toBe('owner@acme.com');
    });

    it('uses default pageSize when not provided', async () => {
      prisma.tenantMembership.findMany.mockResolvedValueOnce([]);
      prisma.tenantMembership.count.mockResolvedValueOnce(0);

      const result = await service.listMembers(TENANT_A);
      expect(result.pageSize).toBe(50);
    });

    it('clamps pageSize to MAX_PAGE_SIZE (200)', async () => {
      prisma.tenantMembership.findMany.mockResolvedValueOnce([]);
      prisma.tenantMembership.count.mockResolvedValueOnce(0);

      const result = await service.listMembers(TENANT_A, 1, 9999);
      expect(result.pageSize).toBe(200);
    });
  });
});
