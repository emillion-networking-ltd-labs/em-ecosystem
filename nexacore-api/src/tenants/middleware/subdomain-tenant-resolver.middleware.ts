// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * SubdomainTenantResolverMiddleware — request-boundary tenant binding.
 *
 * SCRUM-495 / AUTH v2 + Tenancy v1 — Phase 2.1 (D-008).
 *
 * Defense-in-depth on top of Phase 0.2's Prisma `$extends` tenant-filter.
 * Extracts the subdomain from `Host`, resolves it to a `Tenant`, and binds
 * `TenantContext` for the rest of the request via `TenantContext.run`.
 *
 * If the middleware succeeds, downstream guards/interceptors/controllers see
 * the tenant context already bound. The `TenantContextInterceptor` (also
 * modified in this ticket) becomes a VALIDATOR that confirms the
 * authenticated user has membership in the bound tenant — it does NOT
 * re-bind context (which would override middleware's subdomain choice).
 *
 * Skip paths:
 *  - Host `localhost` / IP — preserves dev + e2e behavior (interceptor falls
 *    back to user-first-active-membership lookup).
 *  - Path `/health` / `/metrics` — bypass (no tenant context needed).
 *  - Subdomain matching `app.platformAdminSubdomain` — wraps in
 *    `TenantContext.runWithBypass('platform-admin-route')`.
 *
 * Cache: in-process LRU keyed by subdomain (1024 entries × 5min TTL).
 * Invalidated externally via `SubdomainTenantResolverMiddleware.invalidate(subdomain)`
 * (called by `TenantsService.update` when `subdomain` changes — left for
 * Phase 2.2+ when update-tenant surface exists).
 *
 * All failures return generic 404 (NotFoundException, ErrorMessages.tenants.NOT_FOUND)
 * to hide which subdomains exist — same discipline as MembershipsService 404s.
 */

import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { ErrorMessages } from '../../common/constants/error-messages';
import { TenantContext } from '../../common/context/tenant-context';
import { TenantsService } from '../tenants.service';

const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'dashboard',
  'mail',
  'support',
  'status',
  'www',
  'static',
  'cdn',
  'health',
  'metrics',
  'platform',
  'internal',
]);

const SKIP_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const SKIP_PATHS = new Set(['/health', '/metrics']);

const CACHE_SIZE = 1024;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  tenantId: string;
  expiresAt: number;
}

// Module-level cache (one instance per Node process — middleware is request-scoped
// but the class itself is a singleton provider in NestJS DI).
const cache: Map<string, CacheEntry> = new Map();

// Simple in-memory token bucket for SUBDOMAIN_RESOLUTION_FAILED audit emissions.
// 10 events / 60s window per process; protects audit log from DNS-misconfig spam.
const failureBucket = {
  windowStart: Date.now(),
  count: 0,
};
const FAILURE_AUDIT_WINDOW_MS = 60_000;
const FAILURE_AUDIT_MAX = 10;

@Injectable()
export class SubdomainTenantResolverMiddleware implements NestMiddleware {
  constructor(
    private readonly tenants: TenantsService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const hostHeader = req.headers.host ?? '';
    const host = hostHeader.split(':')[0].toLowerCase();

    // Skip-path: localhost / IP / health / metrics
    if (SKIP_HOSTS.has(host) || SKIP_PATHS.has(req.path)) {
      return next();
    }

    const subdomain = host.split('.')[0];
    if (!subdomain) {
      return next();
    }

    // Platform-admin canonical: wrap remainder in audit-bypass scope
    const platformAdminSubdomain =
      this.configService.get<string>('app.platformAdminSubdomain') ?? 'admin';
    if (subdomain === platformAdminSubdomain) {
      // Defer audit emission to the consumer (auditAndRunBypass helper or
      // downstream code that actually USES the bypass).
      return TenantContext.runWithBypass('platform-admin-route', () => {
        next();
      });
    }

    // Reserved-subdomain (non-platform-admin) → generic 404
    if (RESERVED_SUBDOMAINS.has(subdomain)) {
      throw new NotFoundException(ErrorMessages.tenants.NOT_FOUND);
    }

    // Cache check
    const now = Date.now();
    const cached = cache.get(subdomain);
    if (cached && cached.expiresAt > now) {
      return TenantContext.run(cached.tenantId, () => {
        next();
      });
    }

    // Cache miss → DB lookup
    const tenant = await this.tenants.findBySubdomain(subdomain);
    if (
      !tenant ||
      tenant.status === 'suspended' ||
      tenant.status === 'deleted'
    ) {
      await this.recordResolutionFailure(subdomain, host);
      throw new NotFoundException(ErrorMessages.tenants.NOT_FOUND);
    }

    // Cache + bind
    this.cachePut(subdomain, tenant.id, now);
    return TenantContext.run(tenant.id, () => {
      next();
    });
  }

  /**
   * External invalidation hook — called by `TenantsService.update` when
   * `subdomain` changes. Phase 2.1 leaves wiring for Phase 2.2+; the hook
   * lives here so the cache is centralized.
   */
  static invalidate(subdomain: string): void {
    cache.delete(subdomain);
  }

  private cachePut(subdomain: string, tenantId: string, now: number): void {
    if (cache.size >= CACHE_SIZE) {
      // Eviction policy: drop the oldest entry (Map preserves insertion order).
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(subdomain, { tenantId, expiresAt: now + CACHE_TTL_MS });
  }

  /**
   * Audit `SUBDOMAIN_RESOLUTION_FAILED` with a per-process rate limit so a
   * misconfigured DNS doesn't flood the audit log.
   */
  private async recordResolutionFailure(
    subdomain: string,
    host: string,
  ): Promise<void> {
    const now = Date.now();
    if (now - failureBucket.windowStart > FAILURE_AUDIT_WINDOW_MS) {
      failureBucket.windowStart = now;
      failureBucket.count = 0;
    }
    if (failureBucket.count >= FAILURE_AUDIT_MAX) {
      return;
    }
    failureBucket.count += 1;
    await this.auditService.log({
      action: AuditAction.SUBDOMAIN_RESOLUTION_FAILED,
      userId: null,
      metadata: { subdomain, host },
    });
  }
}
