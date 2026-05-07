import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: Parameters<ThrottlerGuard['handleRequest']>[0],
  ): Promise<boolean> {
    const {
      context,
      limit,
      ttl,
      throttler,
      blockDuration,
      getTracker,
      generateKey,
    } = requestProps;
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<Request>();

    const tracker = await getTracker(request, context);
    const throttlerName = throttler.name || 'default';
    const key = generateKey(context, tracker, throttlerName);
    // Note: storageService.increment returns timeToExpire and timeToBlockExpire
    // already in SECONDS (via getExpirationTime which divides by 1000).
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );

    const resetTime = Math.ceil(Date.now() / 1000) + timeToExpire;

    if (isBlocked || totalHits > limit) {
      const retryAfterSeconds = isBlocked
        ? Math.max(timeToBlockExpire, 1)
        : Math.max(timeToExpire, 1);

      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Remaining', 0);
      response.setHeader('X-RateLimit-Reset', resetTime);
      response.setHeader('Retry-After', retryAfterSeconds);

      throw new HttpException(
        {
          success: false,
          error: {
            message: 'Too many requests.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            retryAfter: retryAfterSeconds,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - totalHits));
    response.setHeader('X-RateLimit-Reset', resetTime);

    return true;
  }

  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    throttlerName: string,
  ): string {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.socket?.remoteAddress || 'unknown';
    const handler = context.getHandler().name;
    const classRef = context.getClass().name;
    return `${throttlerName}-${classRef}-${handler}-${ip}-${suffix}`;
  }
}
