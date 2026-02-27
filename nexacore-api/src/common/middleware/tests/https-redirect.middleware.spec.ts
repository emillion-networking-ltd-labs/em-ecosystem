import { INestApplication } from '@nestjs/common';
import { registerHttpsRedirectMiddleware } from '../https-redirect.middleware';

describe('registerHttpsRedirectMiddleware', () => {
  let mockApp: jest.Mocked<INestApplication>;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    originalNodeEnv = process.env.NODE_ENV;
    mockApp = {
      use: jest.fn(),
    } as unknown as jest.Mocked<INestApplication>;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should not register middleware when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development';

    registerHttpsRedirectMiddleware(mockApp);

    expect(mockApp.use).not.toHaveBeenCalled();
  });

  it('should redirect HTTP to HTTPS with 301 in production', () => {
    process.env.NODE_ENV = 'production';

    registerHttpsRedirectMiddleware(mockApp);

    expect(mockApp.use).toHaveBeenCalledTimes(1);

    const middleware = (mockApp.use as jest.Mock).mock.calls[0][0];
    const req = {
      headers: { 'x-forwarded-proto': 'http' },
      hostname: 'example.com',
      url: '/dashboard?tab=settings',
    };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(
      301,
      'https://example.com/dashboard?tab=settings',
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() when x-forwarded-proto is https', () => {
    process.env.NODE_ENV = 'production';

    registerHttpsRedirectMiddleware(mockApp);

    const middleware = (mockApp.use as jest.Mock).mock.calls[0][0];
    const req = {
      headers: { 'x-forwarded-proto': 'https' },
      hostname: 'example.com',
      url: '/',
    };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should call next() when x-forwarded-proto header is absent', () => {
    process.env.NODE_ENV = 'production';

    registerHttpsRedirectMiddleware(mockApp);

    const middleware = (mockApp.use as jest.Mock).mock.calls[0][0];
    const req = {
      headers: {},
      hostname: 'example.com',
      url: '/',
    };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
