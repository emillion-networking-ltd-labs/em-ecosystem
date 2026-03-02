import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { SafeUser } from '../../users/entities/user.entity';
import { CookieConfig } from '../auth.service';
import { REDIS_CLIENT } from '../../common/services/redis.constants';

const CODE_TTL_SECONDS = 60; // 60 seconds

export interface OAuthTokenPayload {
  accessToken: string;
  user: SafeUser;
  cookie: CookieConfig;
}

@Injectable()
export class OAuthCodeStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async store(payload: OAuthTokenPayload): Promise<string> {
    const code = randomUUID();
    await this.redis.set(
      `oauth:code:${code}`,
      JSON.stringify(payload),
      'EX',
      CODE_TTL_SECONDS,
    );
    return code;
  }

  async exchange(code: string): Promise<OAuthTokenPayload | null> {
    const data = await this.redis.getdel(`oauth:code:${code}`);
    if (!data) return null;
    const payload = JSON.parse(data) as OAuthTokenPayload;
    // Reconstruct Date objects lost during JSON serialization
    payload.user.createdAt = new Date(payload.user.createdAt);
    payload.user.updatedAt = new Date(payload.user.updatedAt);
    return payload;
  }

  /** No-op — Redis TTL handles expiration automatically. */
  cleanup(): void {
    // Redis TTL handles expiration
  }
}
