import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantStatus } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { ErrorMessages } from '../../common/constants/error-messages';
import { TenantContext } from '../../common/context/tenant-context';
import { SubdomainTenantResolverMiddleware } from '../middleware/subdomain-tenant-resolver.middleware';
import { TenantsService } from '../tenants.service';

/**
 * SubdomainTenantResolverMiddleware spec — SCRUM-495 / Phase 2.1.
 *
 * Real middleware + mocked TenantsService + spy AuditService + mocked
 * ConfigService. Exercises the host → subdomain → tenantId binding pipeline.
 *
 * NOTE: the module-level LRU cache is shared across test runs. We do NOT
 * reset it between tests; instead, tests use distinct subdomains to avoid
 * cross-test interference.
 */

function tenantRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: 'tenant-id-acme',
    slug: 'acme',
    subdomain: 'acme',
    name: 'Acme Corp',
    status: TenantStatus.active,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function mockReq(host: string, path = '/api/things'): Request {
  return {
    headers: { host },
    path,
  } as unknown as Request;
}

function mockRes(): Response {
  return {} as Response;
}

describe('SubdomainTenantResolverMiddleware', () => {
  let middleware: SubdomainTenantResolverMiddleware;
  let tenantsServiceMock: { findBySubdomain: jest.Mock };
  let auditLog: jest.Mock;

  beforeEach(() => {
    tenantsServiceMock = { findBySubdomain: jest.fn() };
    auditLog = jest.fn();
    const configServiceMock = {
      get: jest.fn((key: string) =>
        key === 'app.platformAdminSubdomain' ? 'platform-admin' : undefined,
      ),
    };
    middleware = new SubdomainTenantResolverMiddleware(
      tenantsServiceMock as unknown as TenantsService,
      configServiceMock as unknown as ConfigService,
      { log: auditLog } as unknown as AuditService,
    );
  });

  describe('happy path', () => {
    it('binds TenantContext.run when valid subdomain resolves', async () => {
      tenantsServiceMock.findBySubdomain.mockResolvedValue(
        tenantRow({ id: 'tid-happy', subdomain: 'sub-happy' }),
      );

      let observedTenantId: string | null = null;
      const next: NextFunction = () => {
        observedTenantId = TenantContext.getActiveTenantId();
      };

      await middleware.use(mockReq('sub-happy.platform.com'), mockRes(), next);
      expect(observedTenantId).toBe('tid-happy');
    });

    it('caches the resolution — second call to same subdomain does not hit DB', async () => {
      tenantsServiceMock.findBySubdomain.mockResolvedValue(
        tenantRow({ id: 'tid-cached', subdomain: 'sub-cached' }),
      );

      const next1: NextFunction = jest.fn();
      const next2: NextFunction = jest.fn();
      await middleware.use(
        mockReq('sub-cached.platform.com'),
        mockRes(),
        next1,
      );
      await middleware.use(
        mockReq('sub-cached.platform.com'),
        mockRes(),
        next2,
      );
      expect(tenantsServiceMock.findBySubdomain).toHaveBeenCalledTimes(1);
    });

    it('platform-admin canonical subdomain enters runWithBypass', async () => {
      let bypassReason: string | null = null;
      const next: NextFunction = () => {
        bypassReason = TenantContext.getBypassReason();
      };

      await middleware.use(
        mockReq('platform-admin.platform.com'),
        mockRes(),
        next,
      );
      expect(bypassReason).toBe('platform-admin-route');
      expect(tenantsServiceMock.findBySubdomain).not.toHaveBeenCalled();
    });
  });

  describe('skip paths', () => {
    it('localhost host → next() with no context binding', async () => {
      let observed: string | null = 'never-set';
      const next: NextFunction = () => {
        observed = TenantContext.getActiveTenantId();
      };
      await middleware.use(mockReq('localhost:3000'), mockRes(), next);
      expect(observed).toBeNull();
      expect(tenantsServiceMock.findBySubdomain).not.toHaveBeenCalled();
    });

    it('/health path → next() with no context binding', async () => {
      let observed: string | null = 'never-set';
      const next: NextFunction = () => {
        observed = TenantContext.getActiveTenantId();
      };
      await middleware.use(
        mockReq('sub.platform.com', '/health'),
        mockRes(),
        next,
      );
      expect(observed).toBeNull();
    });

    it('/metrics path → next() with no context binding', async () => {
      const next: NextFunction = jest.fn();
      await middleware.use(
        mockReq('sub.platform.com', '/metrics'),
        mockRes(),
        next,
      );
      expect(next).toHaveBeenCalled();
      expect(tenantsServiceMock.findBySubdomain).not.toHaveBeenCalled();
    });
  });

  describe('reserved subdomain', () => {
    it('throws 404 with generic message for reserved subdomain (not platform-admin)', async () => {
      const next: NextFunction = jest.fn();
      try {
        await middleware.use(mockReq('api.platform.com'), mockRes(), next);
        fail('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        expect((e as NotFoundException).message).toBe(
          ErrorMessages.tenants.NOT_FOUND,
        );
      }
      expect(tenantsServiceMock.findBySubdomain).not.toHaveBeenCalled();
    });
  });

  describe('lookup failures', () => {
    it('tenant not found → 404 generic + SUBDOMAIN_RESOLUTION_FAILED audit', async () => {
      tenantsServiceMock.findBySubdomain.mockResolvedValue(null);
      const next: NextFunction = jest.fn();
      try {
        await middleware.use(
          mockReq('does-not-exist-xyz.platform.com'),
          mockRes(),
          next,
        );
        fail('expected throw');
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
      const failureCall = auditLog.mock.calls.find(
        (c) => c[0].action === AuditAction.SUBDOMAIN_RESOLUTION_FAILED,
      );
      expect(failureCall).toBeDefined();
      expect(failureCall![0].metadata.subdomain).toBe('does-not-exist-xyz');
    });

    it('suspended tenant → 404 generic', async () => {
      tenantsServiceMock.findBySubdomain.mockResolvedValue(
        tenantRow({
          subdomain: 'sub-suspended',
          status: TenantStatus.suspended,
        }),
      );
      const next: NextFunction = jest.fn();
      await expect(
        middleware.use(mockReq('sub-suspended.platform.com'), mockRes(), next),
      ).rejects.toThrow(NotFoundException);
    });

    it('deleted tenant → 404 generic', async () => {
      tenantsServiceMock.findBySubdomain.mockResolvedValue(
        tenantRow({ subdomain: 'sub-deleted', status: TenantStatus.deleted }),
      );
      const next: NextFunction = jest.fn();
      await expect(
        middleware.use(mockReq('sub-deleted.platform.com'), mockRes(), next),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cache invalidation', () => {
    it('invalidate(subdomain) removes entry from cache', async () => {
      tenantsServiceMock.findBySubdomain.mockResolvedValue(
        tenantRow({ id: 'tid-inv', subdomain: 'sub-inv' }),
      );

      const next: NextFunction = jest.fn();
      await middleware.use(mockReq('sub-inv.platform.com'), mockRes(), next);
      expect(tenantsServiceMock.findBySubdomain).toHaveBeenCalledTimes(1);

      // Invalidate + second call should re-hit DB
      SubdomainTenantResolverMiddleware.invalidate('sub-inv');
      await middleware.use(mockReq('sub-inv.platform.com'), mockRes(), next);
      expect(tenantsServiceMock.findBySubdomain).toHaveBeenCalledTimes(2);
    });
  });
});
