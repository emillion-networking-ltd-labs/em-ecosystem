/**
 * TenantContextInterceptor — global request → tenant context resolver.
 *
 * SCRUM-488 / AUTH v2 + Tenancy v1 — Phase 0.2.
 *
 * Resolves the active tenant for each request and runs the rest of the
 * pipeline inside a TenantContext.run(...) scope. Resolution strategy:
 *
 *   - Authenticated request (req.user.sub set, Passport-attached SafeUser):
 *     look up the user's first active TenantMembership (oldest joinedAt,
 *     tiebreak on id ASC). 0 active memberships → ForbiddenException.
 *
 *   - Unauthenticated request (no req.user — login, register, public
 *     endpoints): run inside TenantContext.runWithBypass('unauthenticated')
 *     WITHOUT writing an audit log entry. Documented bypass exception:
 *     this is the only production path where bypass is unauthenticated AND
 *     unaudited. Justified because there is no actor to attribute the audit
 *     entry to, and the request cannot mutate tenant-scoped data (every
 *     mutation endpoint sits behind JwtAuthGuard which forces req.user).
 *
 * Forward-compatibility: when JWT v2 (Phase 1) lands with `tenantId` in the
 * payload, this interceptor's resolver body changes to a payload read; the
 * contract (per-request tenantId bound before handler runs) stays.
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
import { TenantsService } from '../../tenants/tenants.service';

type AuthenticatedRequest = Request & {
  user?: { sub?: string; id?: string };
};

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenants: TenantsService) {}

  async intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const sub = req.user?.sub ?? req.user?.id;

    if (!sub) {
      // Unauthenticated path — bypass without audit (documented exception).
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
