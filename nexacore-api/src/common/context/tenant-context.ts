/**
 * TenantContext — request-scoped tenant identity propagation.
 *
 * SCRUM-488 / AUTH v2 + Tenancy v1 — Phase 0.2.
 * See AUTH-v2 program §2.4.
 *
 * Implemented on top of Node's native AsyncLocalStorage so context propagates
 * across all async boundaries (Promises, RxJS, timers, microtasks) without
 * forcing NestJS providers to become request-scoped — which would cascade
 * transitively and collapse our singleton perf profile.
 *
 * Public API:
 *   - run(tenantId, fn)              -> bind tenantId for the duration of fn
 *   - runWithBypass(reason, fn)      -> bind a bypass scope (no tenantId)
 *   - getActiveTenantId()            -> current tenantId or null
 *   - isBypassed()                   -> true iff inside a bypass scope
 *   - getBypassReason()              -> the bypass reason string or null
 *   - getOrThrow()                   -> tenantId or throws TenantContextMissingError
 */

import { AsyncLocalStorage } from 'async_hooks';
import {
  BypassWithoutReasonError,
  TenantContextMissingError,
} from './tenant-context.errors';

interface ContextSlot {
  /** Active tenant id; null while inside a bypass scope. */
  tenantId: string | null;
  /** Non-null implies bypass mode. */
  bypassReason: string | null;
}

const als = new AsyncLocalStorage<ContextSlot>();

export const TenantContext = {
  run<T>(tenantId: string, fn: () => T | Promise<T>): T | Promise<T> {
    return als.run({ tenantId, bypassReason: null }, fn);
  },

  runWithBypass<T>(reason: string, fn: () => T | Promise<T>): T | Promise<T> {
    if (!reason) {
      throw new BypassWithoutReasonError();
    }
    return als.run({ tenantId: null, bypassReason: reason }, fn);
  },

  getActiveTenantId(): string | null {
    return als.getStore()?.tenantId ?? null;
  },

  isBypassed(): boolean {
    const store = als.getStore();
    return store !== undefined && store.bypassReason !== null;
  },

  getBypassReason(): string | null {
    return als.getStore()?.bypassReason ?? null;
  },

  getOrThrow(): string {
    const id = TenantContext.getActiveTenantId();
    if (!id) {
      throw new TenantContextMissingError();
    }
    return id;
  },
};
