import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Observable, of, lastValueFrom } from 'rxjs';
import { TenantContext } from '../../context/tenant-context';
import { TenantContextInterceptor } from '../tenant-context.interceptor';

describe('TenantContextInterceptor', () => {
  function mockCtx(user: { sub?: string; id?: string } | undefined) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  function captureHandler(captured: { id: string | null; bypassed: boolean }) {
    return {
      handle: () =>
        new Observable<unknown>((sub) => {
          captured.id = TenantContext.getActiveTenantId();
          captured.bypassed = TenantContext.isBypassed();
          sub.next('done');
          sub.complete();
        }),
    } as CallHandler;
  }

  it('authenticated user with active membership → handler observes tenantId', async () => {
    const captured = { id: null as string | null, bypassed: false };
    const tenants = {
      findFirstActiveMembership: jest
        .fn()
        .mockResolvedValue({ tenantId: 'tenant-X' }),
    } as unknown as import('../../../tenants/tenants.service').TenantsService;
    const interceptor = new TenantContextInterceptor(tenants);

    const stream = await interceptor.intercept(
      mockCtx({ sub: 'user-1' }),
      captureHandler(captured),
    );
    await lastValueFrom(stream);

    expect(captured).toEqual({ id: 'tenant-X', bypassed: false });
  });

  it('authenticated user falls back to user.id when sub is absent', async () => {
    const captured = { id: null as string | null, bypassed: false };
    const findFirst = jest.fn().mockResolvedValue({ tenantId: 'tenant-Y' });
    const tenants = {
      findFirstActiveMembership: findFirst,
    } as unknown as import('../../../tenants/tenants.service').TenantsService;
    const interceptor = new TenantContextInterceptor(tenants);

    const stream = await interceptor.intercept(
      mockCtx({ id: 'user-2' }),
      captureHandler(captured),
    );
    await lastValueFrom(stream);

    expect(findFirst).toHaveBeenCalledWith('user-2');
    expect(captured.id).toBe('tenant-Y');
  });

  it('authenticated user with 0 active memberships → throws ForbiddenException', async () => {
    const tenants = {
      findFirstActiveMembership: jest.fn().mockResolvedValue(null),
    } as unknown as import('../../../tenants/tenants.service').TenantsService;
    const interceptor = new TenantContextInterceptor(tenants);

    await expect(
      interceptor.intercept(mockCtx({ sub: 'user-3' }), {
        handle: () => of('never'),
      } as CallHandler),
    ).rejects.toThrow(ForbiddenException);
  });

  it('unauthenticated request → bypass scope, no membership lookup', async () => {
    const captured = { id: null as string | null, bypassed: false };
    const findFirst = jest.fn();
    const tenants = {
      findFirstActiveMembership: findFirst,
    } as unknown as import('../../../tenants/tenants.service').TenantsService;
    const interceptor = new TenantContextInterceptor(tenants);

    const stream = await interceptor.intercept(
      mockCtx(undefined),
      captureHandler(captured),
    );
    await lastValueFrom(stream);

    expect(findFirst).not.toHaveBeenCalled();
    expect(captured).toEqual({ id: null, bypassed: true });
  });
});
