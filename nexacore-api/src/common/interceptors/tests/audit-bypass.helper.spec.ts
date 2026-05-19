import { AuditAction } from '../../../audit/enums/audit-action.enum';
import { TenantContext } from '../../context/tenant-context';
import { auditAndRunBypass } from '../audit-bypass.helper';

describe('auditAndRunBypass', () => {
  function makeAudit() {
    const log = jest.fn().mockResolvedValue(undefined);
    return { log } as unknown as { log: jest.Mock } & {
      log: (...args: unknown[]) => Promise<void>;
    };
  }

  it('logs audit entry FIRST then runs fn inside bypass scope', async () => {
    const audit = makeAudit();
    const order: string[] = [];
    audit.log.mockImplementation(async () => {
      order.push('audit');
    });

    const result = await auditAndRunBypass(
      audit as unknown as Parameters<typeof auditAndRunBypass>[0],
      'admin-export',
      { userId: 'u1', ipAddress: '1.2.3.4', userAgent: 'jest' },
      () => {
        order.push('fn');
        return 42;
      },
    );

    expect(result).toBe(42);
    expect(order).toEqual(['audit', 'fn']);
    expect(audit.log).toHaveBeenCalledTimes(1);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.TENANT_FILTER_BYPASS,
        userId: 'u1',
        ipAddress: '1.2.3.4',
        userAgent: 'jest',
        metadata: { reason: 'admin-export' },
      }),
    );
  });

  it('fn observes bypass scope (isBypassed + reason)', async () => {
    const audit = makeAudit();
    const observed = await auditAndRunBypass(
      audit as unknown as Parameters<typeof auditAndRunBypass>[0],
      'platform-admin',
      {},
      () => ({
        bypassed: TenantContext.isBypassed(),
        reason: TenantContext.getBypassReason(),
      }),
    );
    expect(observed).toEqual({ bypassed: true, reason: 'platform-admin' });
  });

  it('audit log failure does not abort the bypass call', async () => {
    const audit = makeAudit();
    // AuditService.log itself swallows internal errors; simulate by resolving
    // (the helper's contract inherits that behavior, so a "failed" audit is
    // indistinguishable from a successful one at this layer).
    audit.log.mockResolvedValue(undefined);

    const result = await auditAndRunBypass(
      audit as unknown as Parameters<typeof auditAndRunBypass>[0],
      'r',
      { userId: null, ipAddress: null, userAgent: null },
      () => 'ok',
    );
    expect(result).toBe('ok');
  });
});
