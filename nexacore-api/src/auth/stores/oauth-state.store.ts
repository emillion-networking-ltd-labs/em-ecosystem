import { Injectable } from '@nestjs/common';
import { randomUUID, randomBytes, createHash } from 'crypto';

const STATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface StateEntry {
  timestamp: number;
  codeVerifier: string;
}

@Injectable()
export class OAuthStateStore {
  private readonly states = new Map<string, StateEntry>();

  generate(): { state: string; codeChallenge: string } {
    this.cleanup();
    const state = randomUUID();
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    this.states.set(state, { timestamp: Date.now(), codeVerifier });
    return { state, codeChallenge };
  }

  /** Peek at the code_verifier without consuming the entry. */
  getCodeVerifier(state: string): string | undefined {
    const entry = this.states.get(state);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > STATE_TTL_MS) return undefined;
    return entry.codeVerifier;
  }

  /** Consume and validate the state entry (single-use). */
  validate(state: string): boolean {
    const entry = this.states.get(state);
    if (!entry) return false;

    this.states.delete(state); // single-use

    if (Date.now() - entry.timestamp > STATE_TTL_MS) return false;

    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [state, entry] of this.states) {
      if (now - entry.timestamp > STATE_TTL_MS) {
        this.states.delete(state);
      }
    }
  }
}
