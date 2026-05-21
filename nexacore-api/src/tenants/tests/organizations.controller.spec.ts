import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationRole, TenantRole, TenantStatus } from '@prisma/client';
import type { Request } from 'express';
import { ErrorMessages } from '../../common/constants/error-messages';
import { MembershipsService } from '../memberships.service';
import { OrganizationsController } from '../organizations.controller';
import { OrganizationsService } from '../organizations.service';
import { TenantsService } from '../tenants.service';

const TENANT_A = 'cccc3333-cccc-3333-cccc-cccc33333333';
const ORG_A = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';
const USER_A = 'bbbb2222-bbbb-2222-bbbb-bbbb22222222';
const USER_B = 'dddd4444-dddd-4444-dddd-dddd44444444';

function authReq(
  user: { id?: string; sub?: string; isPlatformAdmin?: boolean } = {
    id: USER_A,
    isPlatformAdmin: false,
  },
): Request {
  return { user } as unknown as Request;
}

function orgRow(overrides: Record<string, unknown> = {}) {
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

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let organizationsService: jest.Mocked<
    Pick<
      OrganizationsService,
      | 'listForTenant'
      | 'findById'
      | 'create'
      | 'addMember'
      | 'requireMembership'
    >
  >;
  let membershipsService: jest.Mocked<
    Pick<MembershipsService, 'requireMembership' | 'requireTenantRole'>
  >;
  let tenantsService: jest.Mocked<Pick<TenantsService, 'findById'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: {
            listForTenant: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            addMember: jest.fn(),
            requireMembership: jest.fn(),
          },
        },
        {
          provide: MembershipsService,
          useValue: {
            requireMembership: jest.fn(),
            requireTenantRole: jest.fn(),
          },
        },
        { provide: TenantsService, useValue: { findById: jest.fn() } },
      ],
    }).compile();
    controller = moduleRef.get(OrganizationsController);
    organizationsService = moduleRef.get(OrganizationsService);
    membershipsService = moduleRef.get(MembershipsService);
    tenantsService = moduleRef.get(TenantsService);
  });

  describe('listForTenant', () => {
    it('requires membership then returns orgs', async () => {
      membershipsService.requireMembership.mockResolvedValue(null);
      organizationsService.listForTenant.mockResolvedValue([orgRow()]);

      const result = await controller.listForTenant(TENANT_A, authReq());

      expect(membershipsService.requireMembership).toHaveBeenCalledWith(
        TENANT_A,
        USER_A,
        false,
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(ORG_A);
    });

    it('platform admin: verifies tenant exists via TenantsService.findById', async () => {
      membershipsService.requireMembership.mockResolvedValue(null);
      tenantsService.findById.mockResolvedValue({
        id: TENANT_A,
        slug: 'acme',
        subdomain: 'acme',
        name: 'Acme',
        status: TenantStatus.active,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      organizationsService.listForTenant.mockResolvedValue([]);

      await controller.listForTenant(
        TENANT_A,
        authReq({ id: 'admin-id', isPlatformAdmin: true }),
      );

      expect(tenantsService.findById).toHaveBeenCalledWith(TENANT_A);
    });
  });

  describe('findById', () => {
    it('returns the org when found', async () => {
      membershipsService.requireMembership.mockResolvedValue(null);
      organizationsService.findById.mockResolvedValue(orgRow());

      const result = await controller.findById(TENANT_A, ORG_A, authReq());
      expect(result.id).toBe(ORG_A);
    });

    it('throws 404 with ORGANIZATIONS.NOT_FOUND when missing', async () => {
      membershipsService.requireMembership.mockResolvedValue(null);
      organizationsService.findById.mockResolvedValue(null);

      try {
        await controller.findById(TENANT_A, ORG_A, authReq());
        fail('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect((e as NotFoundException).message).toBe(
          ErrorMessages.organizations.NOT_FOUND,
        );
      }
    });
  });

  describe('create', () => {
    it('requires OWNER/ADMIN role then delegates to service', async () => {
      membershipsService.requireTenantRole.mockResolvedValue(null);
      organizationsService.create.mockResolvedValue(orgRow({ id: 'org-new' }));

      const result = await controller.create(
        TENANT_A,
        { name: 'Engineering', slug: 'engineering' },
        authReq(),
      );

      expect(membershipsService.requireTenantRole).toHaveBeenCalledWith(
        TENANT_A,
        USER_A,
        [TenantRole.OWNER, TenantRole.ADMIN],
        false,
      );
      expect(result.id).toBe('org-new');
    });
  });

  describe('addMember', () => {
    it('non-platform-admin must be OWNER/ADMIN of the org', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        id: 'om-caller',
        organizationId: ORG_A,
        userId: USER_A,
        role: OrganizationRole.OWNER,
        joinedAt: new Date(),
      });
      organizationsService.addMember.mockResolvedValue({
        id: 'om-new',
        organizationId: ORG_A,
        userId: USER_B,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date(),
      });

      const result = await controller.addMember(
        ORG_A,
        { userId: USER_B, role: OrganizationRole.MEMBER },
        authReq(),
      );
      expect(result.id).toBe('om-new');
      expect(organizationsService.addMember).toHaveBeenCalledWith(
        ORG_A,
        USER_B,
        OrganizationRole.MEMBER,
        USER_A,
      );
    });

    it('caller who is MEMBER (not OWNER/ADMIN) → 404 ORG.NOT_FOUND', async () => {
      organizationsService.requireMembership.mockResolvedValue({
        id: 'om-caller',
        organizationId: ORG_A,
        userId: USER_A,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date(),
      });

      try {
        await controller.addMember(
          ORG_A,
          { userId: USER_B, role: OrganizationRole.MEMBER },
          authReq(),
        );
        fail('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
      expect(organizationsService.addMember).not.toHaveBeenCalled();
    });

    it('platform admin → no caller-membership check; addMember called', async () => {
      organizationsService.addMember.mockResolvedValue({
        id: 'om-new',
        organizationId: ORG_A,
        userId: USER_B,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date(),
      });

      await controller.addMember(
        ORG_A,
        { userId: USER_B, role: OrganizationRole.MEMBER },
        authReq({ id: 'platform-admin-1', isPlatformAdmin: true }),
      );
      expect(organizationsService.requireMembership).not.toHaveBeenCalled();
      expect(organizationsService.addMember).toHaveBeenCalled();
    });
  });
});
