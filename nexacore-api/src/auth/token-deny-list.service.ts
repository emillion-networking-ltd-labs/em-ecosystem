import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/services/redis.constants';

export const ACCESS_TOKEN_TTL_SECONDS = 900; // 15 minutes

@Injectable()
export class TokenDenyListService {
  private readonly logger = new Logger(TokenDenyListService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async denyToken(jti: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(`deny:jti:${jti}`, '1', 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Failed to deny token jti=${jti}: ${(err as Error).message}`);
    }
  }

  async denyAllForUser(userId: string, ttlSeconds: number): Promise<void> {
    try {
      const denyBefore = Math.floor(Date.now() / 1000).toString();
      await this.redis.set(`deny:user:${userId}`, denyBefore, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Failed to deny user=${userId}: ${(err as Error).message}`);
    }
  }

  async isDenied(jti: string, userId: string, iat?: number): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.exists(`deny:jti:${jti}`);
      pipeline.get(`deny:user:${userId}`);
      const results = await pipeline.exec();

      if (!results) return false;

      const jtiDenied = results[0]?.[1] === 1;
      const denyBefore = results[1]?.[1] as string | null;

      if (jtiDenied) return true;

      // User-level deny: only reject tokens issued BEFORE the deny timestamp
      if (denyBefore && iat) {
        return iat <= parseInt(denyBefore, 10);
      }

      // Legacy fallback: if no iat provided, treat any deny:user key as denied
      return !!denyBefore;
    } catch (err) {
      this.logger.warn(`Failed to check deny-list: ${(err as Error).message}`);
      return false; // fail-open: availability over security for 15-min tokens
    }
  }
}
