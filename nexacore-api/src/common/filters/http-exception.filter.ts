import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: string[] | undefined;

    // Log unhandled (non-HTTP) exceptions — these are real bugs
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;

        // Short-circuit if already in our custom format (e.g., from CustomThrottlerGuard)
        if (responseObj.success === false && responseObj.error) {
          const errorObj = responseObj.error as Record<string, unknown>;
          // Strip retryAfter from body — it's already in the Retry-After HTTP header
          if (typeof errorObj.retryAfter === 'number') {
            response.setHeader('Retry-After', String(errorObj.retryAfter));
            delete errorObj.retryAfter;
          }
          response.status(statusCode).json(exceptionResponse);
          return;
        }

        message = (responseObj.message as string) || exception.message;

        if (Array.isArray(responseObj.message)) {
          details = this.sanitizeValidationDetails(
            responseObj.message as string[],
          );
          message = 'Validation failed';
        }

        // Set Retry-After header (standard HTTP mechanism) instead of leaking in body
        if (typeof responseObj.retryAfter === 'number') {
          response.setHeader('Retry-After', String(responseObj.retryAfter));
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
      },
    });
  }

  private sanitizeValidationDetails(details: string[]): string[] {
    return details.map((detail) => {
      // Handle "property fieldName should not exist" (forbidNonWhitelisted)
      if (/^property \S+ should not exist$/i.test(detail)) {
        return 'Unknown property is not allowed';
      }
      // class-validator format: "fieldName constraint message" or "nested.field constraint message"
      // Strip the leading field name (including dotted paths) to prevent DTO structure disclosure (CWE-209)
      const stripped = detail.replace(/^[a-zA-Z_][a-zA-Z0-9_.]*\s+/, '');
      return stripped.charAt(0).toUpperCase() + stripped.slice(1);
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
