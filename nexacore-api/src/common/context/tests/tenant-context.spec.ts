import { TenantContext } from '../tenant-context';
import {
  BypassWithoutReasonError,
  TenantContextMissingError,
} from '../tenant-context.errors';

describe('TenantContext', () => {
  describe('run', () => {
    it('binds tenantId for the duration of a sync fn', () => {
      const result = TenantContext.run('tenant-A', () => {
        return TenantContext.getActiveTenantId();
      });
      expect(result).toBe('tenant-A');
    });

    it('clears context outside the run scope', () => {
      void TenantContext.run('tenant-A', () => undefined);
      expect(TenantContext.getActiveTenantId()).toBeNull();
    });

    it('propagates context across await boundaries', async () => {
      const result = await TenantContext.run('tenant-B', async () => {
        await Promise.resolve();
        await new Promise((r) => setImmediate(r));
        return TenantContext.getActiveTenantId();
      });
      expect(result).toBe('tenant-B');
    });

    it('innermost nested run wins; outer is restored on exit', () => {
      const observed: (string | null)[] = [];
      void TenantContext.run('outer', () => {
        observed.push(TenantContext.getActiveTenantId());
        void TenantContext.run('inner', () => {
          observed.push(TenantContext.getActiveTenantId());
        });
        observed.push(TenantContext.getActiveTenantId());
      });
      expect(observed).toEqual(['outer', 'inner', 'outer']);
    });
  });

  describe('runWithBypass', () => {
    it('marks the slot as bypassed and exposes the reason', () => {
      const observed = TenantContext.runWithBypass('admin-export', () => ({
        bypassed: TenantContext.isBypassed(),
        reason: TenantContext.getBypassReason(),
        tenant: TenantContext.getActiveTenantId(),
      }));
      expect(observed).toEqual({
        bypassed: true,
        reason: 'admin-export',
        tenant: null,
      });
    });

    it('throws BypassWithoutReasonError when reason is empty', () => {
      expect(() => TenantContext.runWithBypass('', () => undefined)).toThrow(
        BypassWithoutReasonError,
      );
    });
  });

  describe('getOrThrow', () => {
    it('returns the active tenantId inside a run scope', () => {
      const id = TenantContext.run('tenant-C', () =>
        TenantContext.getOrThrow(),
      );
      expect(id).toBe('tenant-C');
    });

    it('throws TenantContextMissingError outside any scope', () => {
      expect(() => TenantContext.getOrThrow()).toThrow(
        TenantContextMissingError,
      );
    });

    it('throws TenantContextMissingError inside a bypass scope', () => {
      expect(() =>
        TenantContext.runWithBypass('x', () => TenantContext.getOrThrow()),
      ).toThrow(TenantContextMissingError);
    });
  });

  describe('isBypassed / getBypassReason outside scope', () => {
    it('returns false / null when no scope is active', () => {
      expect(TenantContext.isBypassed()).toBe(false);
      expect(TenantContext.getBypassReason()).toBeNull();
    });
  });
});
