import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: Parameters<ThrottlerGuard['handleRequest']>[0],
  ): Promise<boolean> {
    const { context, limit, ttl } = requestProps;
    const response = context.switchToHttp().getResponse<Response>();

    try {
      const result = await super.handleRequest(requestProps);

      const resetTime = Math.ceil((Date.now() + ttl) / 1000);
      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Reset', resetTime);

      return result;
    } catch (error) {
      if (error instanceof ThrottlerException) {
        const retryAfterSeconds = Math.ceil(ttl / 1000);
        const resetTime = Math.ceil((Date.now() + ttl) / 1000);

        response.setHeader('X-RateLimit-Limit', limit);
        response.setHeader('X-RateLimit-Remaining', 0);
        response.setHeader('X-RateLimit-Reset', resetTime);
        response.setHeader('Retry-After', retryAfterSeconds);

        throw new HttpException(
          {
            success: false,
            error: {
              message: 'Too many requests. Please try again later.',
              code: 'RATE_LIMIT_EXCEEDED',
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              retryAfter: retryAfterSeconds,
            },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }
  }

  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    throttlerName: string,
  ): string {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    return `${throttlerName}-${ip}-${suffix}`;
  }
}
