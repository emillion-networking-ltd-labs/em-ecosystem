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
      // class-validator format: "fieldName constraint message"
      // Strip the leading field name to prevent DTO structure disclosure (CWE-209)
      const stripped = detail.replace(/^[a-zA-Z_][a-zA-Z0-9_]* /, '');
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
