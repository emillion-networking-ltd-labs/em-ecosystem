import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: string[] | undefined;
    let retryAfter: number | undefined;
    let lockoutLevel: number | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;

        // Short-circuit if already in our custom format (e.g., from CustomThrottlerGuard)
        if (responseObj.success === false && responseObj.error) {
          response.status(statusCode).json(exceptionResponse);
          return;
        }

        message = (responseObj.message as string) || exception.message;

        if (Array.isArray(responseObj.message)) {
          details = responseObj.message as string[];
          message = 'Validation failed';
        }

        // Pass through retryAfter and lockoutLevel from ForbiddenException payloads
        if (typeof responseObj.retryAfter === 'number') {
          retryAfter = responseObj.retryAfter;
        }
        if (typeof responseObj.lockoutLevel === 'number') {
          lockoutLevel = responseObj.lockoutLevel;
        }
      }

      code = this.getErrorCode(statusCode);
    }

    response.status(statusCode).json({
      success: false,
      error: {
        message,
        code,
        statusCode,
        ...(details && { details }),
        ...(retryAfter !== undefined && { retryAfter }),
        ...(lockoutLevel !== undefined && { lockoutLevel }),
      },
    });
  }

  private getErrorCode(statusCode: number): string {
    const codeMap: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return codeMap[statusCode] || 'UNKNOWN_ERROR';
  }
}
