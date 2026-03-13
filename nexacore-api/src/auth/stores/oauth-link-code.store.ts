import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/services/redis.constants';

const LINK_CODE_TTL_SECONDS = 60; // 60 seconds

@Injectable()
export class OAuthLinkCodeStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async generate(userId: string): Promise<string> {
    const code = randomBytes(32).toString('hex');
    await this.redis.set(
      `oauth:link-code:${code}`,
      userId,
      'EX',
      LINK_CODE_TTL_SECONDS,
    );
    return code;
  }

  async consume(code: string): Promise<string | null> {
    const key = `oauth:link-code:${code}`;
    const userId = await this.redis.get(key);
    if (!userId) return null;
    await this.redis.del(key);
    return userId;
  }
}
