import { Inject, Injectable } from '@nestjs/common';
import { randomUUID, randomBytes, createHash } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/services/redis.constants';

const STATE_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class OAuthStateStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async generate(): Promise<{ state: string; codeChallenge: string }> {
    const state = randomUUID();
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    await this.redis.set(
      `oauth:state:${state}`,
      JSON.stringify({ codeVerifier }),
      'EX',
      STATE_TTL_SECONDS,
    );
    return { state, codeChallenge };
  }

  /** Peek at the code_verifier without consuming the entry. */
  async getCodeVerifier(state: string): Promise<string | undefined> {
    const data = await this.redis.get(`oauth:state:${state}`);
    if (!data) return undefined;
    const parsed = JSON.parse(data) as { codeVerifier: string };
    return parsed.codeVerifier;
  }

  /** Consume and validate the state entry (single-use, atomic). */
  async validate(state: string): Promise<boolean> {
    const data = await this.redis.getdel(`oauth:state:${state}`);
    if (!data) return false;
    return true;
  }

  /** No-op — Redis TTL handles expiration automatically. */
  cleanup(): void {
    // Redis TTL handles expiration
  }
}
