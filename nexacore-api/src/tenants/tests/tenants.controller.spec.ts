import { Test, TestingModule } from '@nestjs/testing';
import { TenantRole } from '@prisma/client';
import { Role } from '../../users/enums/role.enum';
import { InvitationsService } from '../invitations.service';
import { MembershipsService } from '../memberships.service';
import { TenantsController } from '../tenants.controller';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_A = 'aaaa1111-aaaa-1111-aaaa-aaaa11111111';

function makeReq(
  overrides: Partial<{ isPlatformAdmin: boolean; email: string }> = {},
) {
  return {
    user: {
      id: USER_A,
      email: overrides.email ?? 'caller@example.com',
      role: Role.USER,
      isPlatformAdmin: overrides.isPlatformAdmin ?? false,
    },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'jest' },
  };
}

describe('TenantsController', () => {
  let controller: TenantsController;
  let invitations: {
    createInvitation: jest.Mock;
    acceptInvitation: jest.Mock;
    revokeInvitation: jest.Mock;
  };
  let memberships: {
    requireMembership: jest.Mock;
    requireTenantRole: jest.Mock;
    listMembers: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    invitations = {
      createInvitation: jest.fn(),
      acceptInvitation: jest.fn(),
      revokeInvitation: jest.fn(),
    };
    memberships = {
      requireMembership: jest.fn().mockResolvedValue(null),
      requireTenantRole: jest.fn().mockResolvedValue(null),
      listMembers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        { provide: InvitationsService, useValue: invitations },
        { provide: MembershipsService, useValue: memberships },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  describe('createInvitation', () => {
    it('calls requireTenantRole then invitations.createInvitation', async () => {
      invitations.createInvitation.mockResolvedValueOnce({
        id: 'inv-1',
        tenantId: TENANT_A,
        email: 'a@b.com',
        role: TenantRole.MEMBER,
        token: 'plaintext',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await controller.createInvitation(
        TENANT_A,
        { email: 'a@b.com', role: TenantRole.MEMBER },
        makeReq(),
      );

      expect(memberships.requireTenantRole).toHaveBeenCalledWith(
        TENANT_A,
        USER_A,
        [TenantRole.OWNER, TenantRole.ADMIN],
        false,
      );
      expect(invitations.createInvitation).toHaveBeenCalledTimes(1);
      expect(result.token).toBe('plaintext');
    });

    it('forwards isPlatformAdmin to requireTenantRole', async () => {
      invitations.createInvitation.mockResolvedValueOnce({});
      await controller.createInvitation(
        TENANT_A,
        { email: 'a@b.com', role: TenantRole.MEMBER },
        makeReq({ isPlatformAdmin: true }),
      );
      expect(memberships.requireTenantRole).toHaveBeenCalledWith(
        TENANT_A,
        USER_A,
        [TenantRole.OWNER, TenantRole.ADMIN],
        true,
      );
    });
  });

  describe('acceptInvitation', () => {
    it('does NOT call membership checks (user might not be a member yet)', async () => {
      invitations.acceptInvitation.mockResolvedValueOnce({
        membershipId: 'm-1',
        tenantId: TENANT_A,
        role: TenantRole.MEMBER,
        status: 'active',
      });

      await controller.acceptInvitation({ token: 'a'.repeat(43) }, makeReq());

      expect(memberships.requireMembership).not.toHaveBeenCalled();
      expect(memberships.requireTenantRole).not.toHaveBeenCalled();
      expect(invitations.acceptInvitation).toHaveBeenCalledTimes(1);
    });
  });

  describe('revokeInvitation', () => {
    it('requires OWNER/ADMIN role then delegates to service', async () => {
      invitations.revokeInvitation.mockResolvedValueOnce(undefined);

      await controller.revokeInvitation(
        TENANT_A,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        makeReq(),
      );

      expect(memberships.requireTenantRole).toHaveBeenCalledWith(
        TENANT_A,
        USER_A,
        [TenantRole.OWNER, TenantRole.ADMIN],
        false,
      );
      expect(invitations.revokeInvitation).toHaveBeenCalledTimes(1);
    });
  });

  describe('listMembers', () => {
    it('requires membership (any role) then delegates to service', async () => {
      memberships.listMembers.mockResolvedValueOnce({
        data: [],
        page: 1,
        pageSize: 50,
        total: 0,
      });

      const result = await controller.listMembers(TENANT_A, makeReq(), 1, 50);

      expect(memberships.requireMembership).toHaveBeenCalledWith(
        TENANT_A,
        USER_A,
        false,
      );
      expect(memberships.listMembers).toHaveBeenCalledWith(TENANT_A, 1, 50);
      expect(result.total).toBe(0);
    });

    it('passes platform-admin flag through', async () => {
      memberships.listMembers.mockResolvedValueOnce({
        data: [],
        page: 1,
        pageSize: 50,
        total: 0,
      });

      await controller.listMembers(
        TENANT_A,
        makeReq({ isPlatformAdmin: true }),
      );

      expect(memberships.requireMembership).toHaveBeenCalledWith(
        TENANT_A,
        USER_A,
        true,
      );
    });
  });
});
