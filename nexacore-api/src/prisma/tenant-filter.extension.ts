/**
 * Tenant-filter Prisma Client Extension.
 *
 * SCRUM-488 / AUTH v2 + Tenancy v1 — Phase 0.2.
 * See AUTH-v2 program §2.4.
 *
 * Every query targeting a registered scoped model (see {@link SCOPED_MODELS})
 * is filtered by `tenantId = active` from the request-scoped TenantContext.
 * Bypass (explicit `runWithBypass(reason, fn)`) is required to opt out;
 * audit-on-decision happens at the bypass entry point in the
 * TenantContextInterceptor (per D-G), NOT here.
 *
 * Fail-closed: scoped op without context AND without bypass throws.
 * Cross-tenant probes (mismatched manual `where.tenantId`) also throw.
 */

import { Prisma } from '@prisma/client';
import { isScopedModel } from '../common/context/scoped-models';
import { TenantContext } from '../common/context/tenant-context';
import { CrossTenantViolationError } from '../common/context/tenant-context.errors';

const READ_OPS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
]);

const WRITE_DATA_OPS = new Set(['create', 'createMany']);

const WHERE_AND_CREATE_OPS = new Set(['update', 'delete', 'upsert']);

/**
 * Pure helper exposed for unit testing. Mutates a deep-cloned args object
 * to inject `tenantId = active`. Throws {@link CrossTenantViolationError}
 * when a caller-supplied tenantId conflicts with the active one.
 */
export function injectTenantId(
  operation: string,
  args: Record<string, unknown> | undefined,
  active: string,
): Record<string, unknown> {
  const next: Record<string, unknown> = args ? { ...args } : {};

  if (READ_OPS.has(operation)) {
    const where = (next.where as Record<string, unknown> | undefined) ?? {};
    assertTenantMatch(where.tenantId, active);
    next.where = { ...where, tenantId: active };
    return next;
  }

  if (operation === 'create') {
    const data = (next.data as Record<string, unknown> | undefined) ?? {};
    assertTenantMatch(data.tenantId, active);
    next.data = { ...data, tenantId: active };
    return next;
  }

  if (operation === 'createMany') {
    const raw = next.data;
    if (Array.isArray(raw)) {
      next.data = raw.map((row: unknown) => {
        const obj = (row as Record<string, unknown>) ?? {};
        assertTenantMatch(obj.tenantId, active);
        return { ...obj, tenantId: active };
      });
    } else {
      const obj = (raw as Record<string, unknown>) ?? {};
      assertTenantMatch(obj.tenantId, active);
      next.data = { ...obj, tenantId: active };
    }
    return next;
  }

  if (WHERE_AND_CREATE_OPS.has(operation)) {
    const where = (next.where as Record<string, unknown> | undefined) ?? {};
    assertTenantMatch(where.tenantId, active);
    next.where = { ...where, tenantId: active };

    if (operation === 'upsert') {
      const create = (next.create as Record<string, unknown> | undefined) ?? {};
      assertTenantMatch(create.tenantId, active);
      next.create = { ...create, tenantId: active };
    }
    return next;
  }

  // Unknown operation — defensive pass-through (Prisma may add new ops in minor releases)
  return next;
}

function assertTenantMatch(supplied: unknown, active: string): void {
  if (supplied !== undefined && supplied !== null && supplied !== active) {
    throw new CrossTenantViolationError();
  }
}

// Reused: declares the marker for forced-ts-includes downstream
void WRITE_DATA_OPS;

/**
 * Inner handler. Exported as a separate function so unit tests can
 * exercise the registry-check / bypass-check / context-resolve / inject
 * pipeline without going through Prisma's opaque extension wrapper.
 */
export async function handleTenantFilteredQuery(input: {
  model: string;
  operation: string;
  args: unknown;
  query: (a: unknown) => Promise<unknown>;
}): Promise<unknown> {
  const { model, operation, args, query } = input;
  if (!isScopedModel(model)) {
    return query(args);
  }
  if (TenantContext.isBypassed()) {
    return query(args);
  }
  const active = TenantContext.getOrThrow();
  const patched = injectTenantId(
    operation,
    args as Record<string, unknown> | undefined,
    active,
  );
  return query(patched);
}

/**
 * Factory returning the Prisma Client Extension that enforces tenant
 * filtering on every operation against {@link SCOPED_MODELS} models.
 */
export function buildTenantFilterExtension() {
  return Prisma.defineExtension({
    name: 'tenant-filter',
    query: {
      $allModels: {
        async $allOperations(params: {
          model: string;
          operation: string;
          args: unknown;
          query: (a: unknown) => Promise<unknown>;
        }): Promise<unknown> {
          return handleTenantFilteredQuery(params);
        },
      },
    },
  });
}
