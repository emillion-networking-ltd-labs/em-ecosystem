import { INestApplication } from '@nestjs/common';

// Mock helmet before importing the middleware
jest.mock('helmet', () => {
  const helmetFn = jest.fn().mockReturnValue('helmet-middleware');
  return { __esModule: true, default: helmetFn };
});

import helmet from 'helmet';
import { registerHelmetMiddleware } from '../helmet.middleware';

describe('registerHelmetMiddleware', () => {
  let mockApp: jest.Mocked<INestApplication>;
  let useCalls: unknown[];

  beforeEach(() => {
    jest.clearAllMocks();
    useCalls = [];
    mockApp = {
      use: jest.fn((...args) => {
        useCalls.push(args[0]);
      }),
    } as unknown as jest.Mocked<INestApplication>;
  });

  it('should register helmet middleware with CSP, HSTS, and xFrameOptions', () => {
    registerHelmetMiddleware(mockApp);

    expect(helmet).toHaveBeenCalledWith(
      expect.objectContaining({
        contentSecurityPolicy: expect.objectContaining({
          reportOnly: false,
        }),
        hsts: expect.objectContaining({
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }),
        xFrameOptions: { action: 'deny' },
        crossOriginEmbedderPolicy: false,
      }),
    );
  });

  it('should register two middlewares via app.use()', () => {
    registerHelmetMiddleware(mockApp);

    expect(mockApp.use).toHaveBeenCalledTimes(2);
  });

  it('should register Permissions-Policy middleware that sets header', () => {
    registerHelmetMiddleware(mockApp);

    // Second call is the Permissions-Policy middleware
    const permissionsMw = (mockApp.use as jest.Mock).mock.calls[1][0];
    expect(typeof permissionsMw).toBe('function');

    const mockRes = { setHeader: jest.fn() };
    const mockNext = jest.fn();

    permissionsMw({}, mockRes, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      expect.stringContaining('camera=()'),
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      expect.stringContaining('microphone=()'),
    );
    expect(mockNext).toHaveBeenCalled();
  });
});
