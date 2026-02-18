import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from '../http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();

    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({}),
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ArgumentsHost;
  });

  it('should handle HttpException with string response', () => {
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Not found',
        code: 'NOT_FOUND',
        statusCode: 404,
      },
    });
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Email already registered', statusCode: 409 },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Email already registered',
        code: 'CONFLICT',
        statusCode: 409,
      },
    });
  });

  it('should handle validation errors with array of messages', () => {
    const exception = new HttpException(
      {
        message: ['Email is required', 'Password too short'],
        error: 'Bad Request',
        statusCode: 400,
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: ['Email is required', 'Password too short'],
      },
    });
  });

  it('should handle non-HttpException errors as 500', () => {
    const exception = new Error('Something went wrong');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      },
    });
  });

  it('should handle unknown exception types as 500', () => {
    filter.catch('string error', mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          statusCode: 500,
          code: 'INTERNAL_SERVER_ERROR',
        }),
      }),
    );
  });

  it('should fallback to exception.message when response object has no message', () => {
    const exception = new HttpException(
      { statusCode: 401 },
      HttpStatus.UNAUTHORIZED,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        message: expect.any(String),
        code: 'UNAUTHORIZED',
        statusCode: 401,
      },
    });
  });

  it('should return UNKNOWN_ERROR code for unmapped status codes', () => {
    const exception = new HttpException('Too many requests', 429);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(429);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Too many requests',
        code: 'UNKNOWN_ERROR',
        statusCode: 429,
      },
    });
  });

  it('should handle HttpException with object response without details when message is not an array', () => {
    const exception = new HttpException(
      { message: 'Forbidden access', statusCode: 403 },
      HttpStatus.FORBIDDEN,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Forbidden access',
        code: 'FORBIDDEN',
        statusCode: 403,
      },
    });
    // Ensure no details key exists
    const callArg = mockJson.mock.calls[0][0];
    expect(callArg.error).not.toHaveProperty('details');
  });
});
