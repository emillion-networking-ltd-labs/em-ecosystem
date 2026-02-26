import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SafeUser } from '../../users/entities/user.entity';

const CODE_TTL_MS = 60 * 1000; // 60 seconds

export interface OAuthTokenPayload {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

@Injectable()
export class OAuthCodeStore {
  private readonly codes = new Map<
    string,
    { payload: OAuthTokenPayload; timestamp: number }
  >();

  store(payload: OAuthTokenPayload): string {
    this.cleanup();
    const code = randomUUID();
    this.codes.set(code, { payload, timestamp: Date.now() });
    return code;
  }

  exchange(code: string): OAuthTokenPayload | null {
    const entry = this.codes.get(code);
    if (!entry) return null;

    this.codes.delete(code); // single-use

    if (Date.now() - entry.timestamp > CODE_TTL_MS) return null;

    return entry.payload;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [code, entry] of this.codes) {
      if (now - entry.timestamp > CODE_TTL_MS) {
        this.codes.delete(code);
      }
    }
  }
}
