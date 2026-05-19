import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorMessages } from '../../common/constants/error-messages';
import { TenantsService } from '../tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';

/**
 * Tests for TenantsService — SCRUM-487 / AUTH v2 + Tenancy v1 Phase 0.1.
 *
 * Mocks PrismaService entirely; no real DB. Migration idempotence + cascade
 * behavior are verified out-of-band via the post-migration smoke query
 * (see plan §7 Testing Checklist).
 */

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: {
    tenant: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    tenantSettings: { create: jest.Mock };
    tenantMembership: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };

  const makeTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
    id: 't-1',
    slug: 'acme',
    name: 'Acme Corp',
    status: 'active',
    createdAt: new Date('2026-05-19T00:00:00Z'),
    updatedAt: new Date('2026-05-19T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      tenant: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tenantSettings: {
        create: jest.fn(),
      },
      tenantMembership: {
        findFirst: jest.fn(),
      },
      // $transaction is invoked with a callback; the callback receives the
      // mocked tx client (which we make === prisma so the test asserts on
      // the same mock instance).
      $transaction: jest.fn((cb: (tx: typeof prisma) => unknown) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  describe('findById', () => {
    it('returns the tenant when found', async () => {
      const tenant = makeTenant();
      prisma.tenant.findUnique.mockResolvedValue(tenant);

      const result = await service.findById('t-1');

      expect(result).toEqual(tenant);
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 't-1' },
      });
    });

    it('returns null when not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('returns the tenant when found', async () => {
      const tenant = makeTenant();
      prisma.tenant.findUnique.mockResolvedValue(tenant);

      const result = await service.findBySlug('acme');

      expect(result).toEqual(tenant);
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme' },
      });
    });

    it('returns null when not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.findBySlug('missing');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates Tenant + TenantSettings atomically and returns the Tenant', async () => {
      const tenant = makeTenant({ slug: 'acme', name: 'Acme Corp' });
      prisma.tenant.create.mockResolvedValue(tenant);
      prisma.tenantSettings.create.mockResolvedValue({ id: 's-1' });

      const dto: CreateTenantDto = { slug: 'acme', name: 'Acme Corp' };
      const result = await service.create(dto);

      expect(result).toEqual(tenant);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: { slug: 'acme', name: 'Acme Corp', status: 'active' },
      });
      expect(prisma.tenantSettings.create).toHaveBeenCalledWith({
        data: { tenantId: tenant.id },
      });
    });

    it('defaults status to "active" when DTO omits it', async () => {
      const tenant = makeTenant();
      prisma.tenant.create.mockResolvedValue(tenant);

      await service.create({ slug: 'acme', name: 'Acme Corp' });

      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'active' }),
      });
    });

    it('honors provided status when DTO supplies it', async () => {
      const tenant = makeTenant({ status: 'trial' });
      prisma.tenant.create.mockResolvedValue(tenant);

      await service.create({ slug: 'acme', name: 'Acme', status: 'trial' });

      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'trial' }),
      });
    });

    it('throws ConflictException with centralized message on slug collision (P2002)', async () => {
      prisma.tenant.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create({ slug: 'taken', name: 'X' }),
      ).rejects.toMatchObject({
        name: 'ConflictException',
        message: ErrorMessages.tenants.SLUG_TAKEN,
      });
    });

    it('rethrows non-P2002 errors unchanged', async () => {
      const otherErr = new Error('db down');
      prisma.tenant.create.mockRejectedValue(otherErr);

      await expect(service.create({ slug: 'x', name: 'x' })).rejects.toBe(
        otherErr,
      );
    });
  });

  describe('update', () => {
    it('returns the updated tenant on happy path', async () => {
      const updated = makeTenant({ name: 'Acme Inc' });
      prisma.tenant.update.mockResolvedValue(updated);

      const result = await service.update('t-1', { name: 'Acme Inc' });

      expect(result).toEqual(updated);
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { name: 'Acme Inc' },
      });
    });

    it('throws NotFoundException when tenant id does not exist (P2025)', async () => {
      prisma.tenant.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.update('missing', { name: 'X' }),
      ).rejects.toMatchObject({
        name: 'NotFoundException',
        message: ErrorMessages.tenants.NOT_FOUND,
      });
    });

    it('throws ConflictException on slug conflict during update (P2002)', async () => {
      prisma.tenant.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.update('t-1', { slug: 'taken' }),
      ).rejects.toMatchObject({
        name: 'ConflictException',
        message: ErrorMessages.tenants.SLUG_TAKEN,
      });
    });
  });

  describe('findFirstActiveMembership (SCRUM-488)', () => {
    it('returns the first active membership ordered by joinedAt ASC, id ASC', async () => {
      const oldest = {
        id: 'm-1',
        tenantId: 't-1',
        userId: 'u-1',
        role: 'OWNER',
        status: 'active',
        joinedAt: new Date('2026-01-01T00:00:00Z'),
      };
      prisma.tenantMembership.findFirst.mockResolvedValue(oldest);

      const result = await service.findFirstActiveMembership('u-1');

      expect(result).toEqual(oldest);
      expect(prisma.tenantMembership.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u-1', status: 'active' },
        orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
      });
    });

    it('returns null when the user has no active memberships', async () => {
      prisma.tenantMembership.findFirst.mockResolvedValue(null);

      const result = await service.findFirstActiveMembership('u-orphan');

      expect(result).toBeNull();
    });
  });
});
