import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { NoCacheInterceptor } from '../no-cache.interceptor';

describe('NoCacheInterceptor', () => {
  let interceptor: NoCacheInterceptor;
  let mockResponse: { setHeader: jest.Mock };
  let mockContext: ExecutionContext;
  let mockNext: CallHandler;

  beforeEach(() => {
    interceptor = new NoCacheInterceptor();

    mockResponse = { setHeader: jest.fn() };

    mockContext = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    mockNext = { handle: () => of({ data: 'test' }) };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should set Cache-Control header', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-store, no-cache, must-revalidate',
      );
      done();
    });
  });

  it('should set Pragma header', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      done();
    });
  });

  it('should set Expires header', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Expires', '0');
      done();
    });
  });

  it('should call next.handle() and pass through the response', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe((result) => {
      expect(result).toEqual({ data: 'test' });
      done();
    });
  });

  it('should set all three headers before response', (done) => {
    interceptor.intercept(mockContext, mockNext).subscribe(() => {
      expect(mockResponse.setHeader).toHaveBeenCalledTimes(3);
      done();
    });
  });
});
