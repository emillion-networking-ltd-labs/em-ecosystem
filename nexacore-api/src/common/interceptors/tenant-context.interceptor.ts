/**
 * TenantContextInterceptor — request → tenant context resolver + validator.
 *
 * SCRUM-488 / AUTH v2 + Tenancy v1 — Phase 0.2 (initial binder behavior).
 * SCRUM-495 / AUTH v2 + Tenancy v1 — Phase 2.1 (validator-not-binder behavior
 * when SubdomainTenantResolverMiddleware has already bound context).
 *
 * Two operating modes after Phase 2.1:
 *
 *   1. Context ALREADY BOUND (middleware ran — request hit a tenant
 *      subdomain like `acme.platform.com`):
 *      - If `req.user` present: VALIDATE the user has an active membership
 *        in the bound tenant via `MembershipsService.requireMembership`.
 *        404 (not 403) on non-membership — preserves the SCRUM-491 discipline.
 *        Does NOT re-bind context (would override middleware via nested run).
 *      - If `req.user` absent (unauthenticated path on tenant subdomain, e.g.
 *        `/auth/login` on `acme.platform.com`): pass through; middleware's
 *        binding is the canonical tenant for the request.
 *
 *   2. Context NOT BOUND (middleware skip-path — localhost, health, etc.):
 *      Old Phase 0.2 behavior — look up the user's first active membership
 *      and bind `TenantContext.run(membership.tenantId, ...)`. Unauthenticated
 *      → `TenantContext.runWithBypass('unauthenticated', ...)`.
 *
 * Forward-compatibility note: when JWT v2 (Phase 1, already shipped) is the
 * canonical consumer of tenant context, the user's `req.user` will carry
 * `tenantId` directly. The validator branch (mode 1) becomes the primary path;
 * the binder fallback (mode 2) survives only for skip-path requests.
 */

import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ErrorMessages } from '../constants/error-messages';
import { TenantContext } from '../context/tenant-context';
import { MembershipsService } from '../../tenants/memberships.service';
import { TenantsService } from '../../tenants/tenants.service';

type AuthenticatedRequest = Request & {
  user?: { sub?: string; id?: string; isPlatformAdmin?: boolean };
};

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly tenants: TenantsService,
    private readonly memberships: MembershipsService,
  ) {}

  async intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const sub = req.user?.sub ?? req.user?.id;
    const isPlatformAdmin = req.user?.isPlatformAdmin ?? false;
    const boundTenantId = TenantContext.getActiveTenantId();

    // MODE 1: Middleware bound the context (subdomain-resolved tenant).
    if (boundTenantId !== null) {
      if (sub) {
        // Validate user has active membership in the bound tenant.
        // requireMembership throws NotFoundException (404) on non-membership
        // — preserves SCRUM-491 discipline of hiding tenant existence.
        // Platform admins short-circuit return null (no validation needed).
        await this.memberships.requireMembership(
          boundTenantId,
          sub,
          isPlatformAdmin,
        );
      }
      // Pass through — do NOT re-bind context (would override middleware).
      return next.handle();
    }

    // MODE 2: Middleware did not bind (skip-path: localhost, health, etc.).
    // Fall back to Phase 0.2 behavior — look up user's first active membership.
    if (!sub) {
      return new Observable((subscriber) => {
        void TenantContext.runWithBypass('unauthenticated', () => {
          next.handle().subscribe({
            next: (v) => subscriber.next(v),
            error: (e) => subscriber.error(e),
            complete: () => subscriber.complete(),
          });
        });
      });
    }

    const membership = await this.tenants.findFirstActiveMembership(sub);
    if (!membership) {
      throw new ForbiddenException(ErrorMessages.tenantContext.MISSING);
    }

    return new Observable((subscriber) => {
      void TenantContext.run(membership.tenantId, () => {
        next.handle().subscribe({
          next: (v) => subscriber.next(v),
          error: (e) => subscriber.error(e),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
