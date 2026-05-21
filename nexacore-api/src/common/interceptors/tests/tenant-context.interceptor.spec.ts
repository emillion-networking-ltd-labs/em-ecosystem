import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Observable, of, lastValueFrom } from 'rxjs';
import { ErrorMessages } from '../../constants/error-messages';
import { TenantContext } from '../../context/tenant-context';
import { TenantContextInterceptor } from '../tenant-context.interceptor';
import { MembershipsService } from '../../../tenants/memberships.service';
import { TenantsService } from '../../../tenants/tenants.service';

/**
 * TenantContextInterceptor spec — SCRUM-488 (Phase 0.2) + SCRUM-495 (Phase 2.1).
 *
 * Two operating modes after Phase 2.1:
 *   MODE 1 — middleware bound context (subdomain-resolved tenant):
 *     - With user: validate via MembershipsService.requireMembership (no re-bind).
 *     - Without user: pass-through (middleware binding canonical).
 *   MODE 2 — middleware did NOT bind (skip-path: localhost, health):
 *     - Old behavior: lookup user.firstActiveMembership; bind. Unauth → bypass.
 */

describe('TenantContextInterceptor', () => {
  function mockCtx(
    user: { sub?: string; id?: string; isPlatformAdmin?: boolean } | undefined,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  function captureHandler(captured: {
    id: string | null;
    bypassed: boolean;
    bypassReason: string | null;
  }): CallHandler {
    return {
      handle: () =>
        new Observable<unknown>((sub) => {
          captured.id = TenantContext.getActiveTenantId();
          captured.bypassed = TenantContext.isBypassed();
          captured.bypassReason = TenantContext.getBypassReason();
          sub.next('done');
          sub.complete();
        }),
    } as CallHandler;
  }

  describe('MODE 1 — middleware bound context', () => {
    it('authenticated user WITH membership → handler sees same tenantId; no re-bind', async () => {
      const captured = {
        id: null as string | null,
        bypassed: false,
        bypassReason: null as string | null,
      };
      const tenants = {} as TenantsService;
      const memberships = {
        requireMembership: jest.fn().mockResolvedValue(null),
      } as unknown as MembershipsService;
      const interceptor = new TenantContextInterceptor(tenants, memberships);

      const result = await TenantContext.run('tenant-bound-X', async () => {
        const stream = await interceptor.intercept(
          mockCtx({ sub: 'user-1', isPlatformAdmin: false }),
          captureHandler(captured),
        );
        return lastValueFrom(stream);
      });

      expect(result).toBe('done');
      expect(captured.id).toBe('tenant-bound-X');
      expect(memberships.requireMembership).toHaveBeenCalledWith(
        'tenant-bound-X',
        'user-1',
        false,
      );
    });

    it('platform admin → requireMembership short-circuits (null); handler runs', async () => {
      const captured = {
        id: null as string | null,
        bypassed: false,
        bypassReason: null as string | null,
      };
      const tenants = {} as TenantsService;
      const memberships = {
        requireMembership: jest.fn().mockResolvedValue(null),
      } as unknown as MembershipsService;
      const interceptor = new TenantContextInterceptor(tenants, memberships);

      const result = await TenantContext.run('tenant-Y', async () => {
        const stream = await interceptor.intercept(
          mockCtx({ sub: 'admin-1', isPlatformAdmin: true }),
          captureHandler(captured),
        );
        return lastValueFrom(stream);
      });

      expect(result).toBe('done');
      expect(memberships.requireMembership).toHaveBeenCalledWith(
        'tenant-Y',
        'admin-1',
        true,
      );
    });

    it('authenticated user WITHOUT membership → NotFoundException propagates', async () => {
      const tenants = {} as TenantsService;
      const memberships = {
        requireMembership: jest
          .fn()
          .mockRejectedValue(
            new NotFoundException(ErrorMessages.tenants.NOT_FOUND),
          ),
      } as unknown as MembershipsService;
      const interceptor = new TenantContextInterceptor(tenants, memberships);

      await expect(
        TenantContext.run('tenant-no-member', async () => {
          await interceptor.intercept(
            mockCtx({ sub: 'user-stranger', isPlatformAdmin: false }),
            { handle: () => of('done') } as CallHandler,
          );
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('unauthenticated request on bound subdomain → pass-through; no membership check', async () => {
      const captured = {
        id: null as string | null,
        bypassed: false,
        bypassReason: null as string | null,
      };
      const tenants = {} as TenantsService;
      const memberships = {
        requireMembership: jest.fn(),
      } as unknown as MembershipsService;
      const interceptor = new TenantContextInterceptor(tenants, memberships);

      await TenantContext.run('tenant-unauth-OK', async () => {
        const stream = await interceptor.intercept(
          mockCtx(undefined),
          captureHandler(captured),
        );
        await lastValueFrom(stream);
      });

      expect(captured.id).toBe('tenant-unauth-OK');
      expect(memberships.requireMembership).not.toHaveBeenCalled();
    });
  });

  describe('MODE 2 — middleware did NOT bind (skip-path)', () => {
    it('authenticated user with active membership → bind tenant from first-active-membership', async () => {
      const captured = {
        id: null as string | null,
        bypassed: false,
        bypassReason: null as string | null,
      };
      const tenants = {
        findFirstActiveMembership: jest
          .fn()
          .mockResolvedValue({ tenantId: 'fallback-tenant' }),
      } as unknown as TenantsService;
      const memberships = {} as MembershipsService;
      const interceptor = new TenantContextInterceptor(tenants, memberships);

      const stream = await interceptor.intercept(
        mockCtx({ sub: 'user-1' }),
        captureHandler(captured),
      );
      await lastValueFrom(stream);

      expect(captured).toEqual({
        id: 'fallback-tenant',
        bypassed: false,
        bypassReason: null,
      });
    });

    it('authenticated user with NO active membership → ForbiddenException', async () => {
      const tenants = {
        findFirstActiveMembership: jest.fn().mockResolvedValue(null),
      } as unknown as TenantsService;
      const memberships = {} as MembershipsService;
      const interceptor = new TenantContextInterceptor(tenants, memberships);

      await expect(
        interceptor.intercept(mockCtx({ sub: 'user-orphan' }), {
          handle: () => of('done'),
        } as CallHandler),
      ).rejects.toThrow(ForbiddenException);
    });

    it('unauthenticated request → runWithBypass("unauthenticated")', async () => {
      const captured = {
        id: null as string | null,
        bypassed: false,
        bypassReason: null as string | null,
      };
      const tenants = {} as TenantsService;
      const memberships = {} as MembershipsService;
      const interceptor = new TenantContextInterceptor(tenants, memberships);

      const stream = await interceptor.intercept(
        mockCtx(undefined),
        captureHandler(captured),
      );
      await lastValueFrom(stream);

      expect(captured.bypassed).toBe(true);
      expect(captured.bypassReason).toBe('unauthenticated');
    });

    it('falls back to req.user.id when sub is absent', async () => {
      const captured = {
        id: null as string | null,
        bypassed: false,
        bypassReason: null as string | null,
      };
      const tenants = {
        findFirstActiveMembership: jest
          .fn()
          .mockResolvedValue({ tenantId: 'tenant-via-id' }),
      } as unknown as TenantsService;
      const memberships = {} as MembershipsService;
      const interceptor = new TenantContextInterceptor(tenants, memberships);

      const stream = await interceptor.intercept(
        mockCtx({ id: 'user-no-sub' }),
        captureHandler(captured),
      );
      await lastValueFrom(stream);
      expect(captured.id).toBe('tenant-via-id');
    });
  });
});
