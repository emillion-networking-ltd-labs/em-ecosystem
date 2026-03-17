import { AuditAction } from '../../audit/enums/audit-action.enum';
import { createAuditLogger, AuditLogger } from '../utils/audit-log.helper';

describe('createAuditLogger', () => {
  let auditService: { log: jest.Mock };
  let logger: AuditLogger;

  beforeEach(() => {
    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };
    logger = createAuditLogger(auditService as any);
  });

  it('should return a function', () => {
    expect(typeof logger).toBe('function');
  });

  it('should call auditService.log with action and null context when no ctx provided', () => {
    logger(AuditAction.LOGIN_SUCCESS);

    expect(auditService.log).toHaveBeenCalledWith({
      action: AuditAction.LOGIN_SUCCESS,
      userId: undefined,
      ipAddress: null,
      userAgent: null,
    });
  });

  it('should pass ipAddress and userAgent from ctx', () => {
    const ctx = { ipAddress: '192.168.1.1', userAgent: 'TestAgent/1.0' };

    logger(AuditAction.LOGOUT, ctx, 'user-123');

    expect(auditService.log).toHaveBeenCalledWith({
      action: AuditAction.LOGOUT,
      userId: 'user-123',
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
    });
  });

  it('should handle null ipAddress and userAgent in ctx', () => {
    const ctx = { ipAddress: null, userAgent: null };

    logger(AuditAction.REGISTER, ctx);

    expect(auditService.log).toHaveBeenCalledWith({
      action: AuditAction.REGISTER,
      userId: undefined,
      ipAddress: null,
      userAgent: null,
    });
  });

  it('should include metadata when provided', () => {
    const ctx = { ipAddress: '10.0.0.1', userAgent: 'Bot' };
    const metadata = { email: 'j***@example.com', outcome: 'success' };

    logger(AuditAction.REGISTER, ctx, 'user-456', metadata);

    expect(auditService.log).toHaveBeenCalledWith({
      action: AuditAction.REGISTER,
      userId: 'user-456',
      ipAddress: '10.0.0.1',
      userAgent: 'Bot',
      metadata: { email: 'j***@example.com', outcome: 'success' },
    });
  });

  it('should not include metadata key when metadata is undefined', () => {
    logger(AuditAction.LOGIN_FAILURE, undefined, 'user-789', undefined);

    const call = auditService.log.mock.calls[0][0];
    expect(call).not.toHaveProperty('metadata');
  });

  it('should not throw when auditService.log rejects', () => {
    auditService.log.mockRejectedValue(new Error('DB down'));

    expect(() => {
      logger(AuditAction.LOGIN_SUCCESS);
    }).not.toThrow();
  });

  it('should handle empty metadata object by including it', () => {
    logger(AuditAction.LOGOUT, undefined, undefined, {});

    // Empty object is truthy, so metadata should NOT be spread
    // {} is truthy → metadata && { metadata } → { metadata: {} }
    const call = auditService.log.mock.calls[0][0];
    expect(call).toHaveProperty('metadata', {});
  });
});
