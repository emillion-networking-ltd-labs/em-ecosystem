import { Inject, Injectable } from '@nestjs/common';
import { randomUUID, randomBytes, createHash } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/services/redis.constants';

const STATE_TTL_SECONDS = 300; // 5 minutes

export type OAuthAction = 'login' | 'link';

export interface OAuthStateData {
  codeVerifier: string;
  action: OAuthAction;
  userId?: string;
}

@Injectable()
export class OAuthStateStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async generate(
    action: OAuthAction = 'login',
    userId?: string,
  ): Promise<{ state: string; codeChallenge: string }> {
    const state = randomUUID();
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const stateData: OAuthStateData = { codeVerifier, action };
    if (userId) stateData.userId = userId;
    await this.redis.set(
      `oauth:state:${state}`,
      JSON.stringify(stateData),
      'EX',
      STATE_TTL_SECONDS,
    );
    return { state, codeChallenge };
  }

  /** Peek at the code_verifier without consuming the entry. */
  async getCodeVerifier(state: string): Promise<string | undefined> {
    const data = await this.redis.get(`oauth:state:${state}`);
    if (!data) return undefined;
    const parsed = JSON.parse(data) as OAuthStateData;
    return parsed.codeVerifier;
  }

  /** Consume and validate the state entry (single-use, atomic). Returns state data if valid. */
  async validate(state: string): Promise<OAuthStateData | null> {
    const key = `oauth:state:${state}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    await this.redis.del(key);
    return JSON.parse(data) as OAuthStateData;
  }

  /** No-op — Redis TTL handles expiration automatically. */
  cleanup(): void {
    // Redis TTL handles expiration
  }
}
