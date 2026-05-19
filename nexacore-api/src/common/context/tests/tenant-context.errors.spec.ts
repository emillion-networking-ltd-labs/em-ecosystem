import {
  BypassWithoutReasonError,
  CrossTenantViolationError,
  TenantContextMissingError,
} from '../tenant-context.errors';

describe('tenant-context.errors', () => {
  it('TenantContextMissingError is an Error and exposes a stable name', () => {
    const e = new TenantContextMissingError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('TenantContextMissingError');
    expect(e.message).toContain('Tenant context required');
  });

  it('CrossTenantViolationError exposes a stable name + default message', () => {
    const e = new CrossTenantViolationError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('CrossTenantViolationError');
    expect(e.message).toContain('Cross-tenant');
  });

  it('BypassWithoutReasonError exposes a stable name + default message', () => {
    const e = new BypassWithoutReasonError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('BypassWithoutReasonError');
    expect(e.message).toContain('reason');
  });

  it('accepts a custom message', () => {
    const e = new TenantContextMissingError('custom');
    expect(e.message).toBe('custom');
  });
});
