import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

const STATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class OAuthStateStore {
  private readonly states = new Map<string, number>();

  generate(): string {
    this.cleanup();
    const state = randomUUID();
    this.states.set(state, Date.now());
    return state;
  }

  validate(state: string): boolean {
    const timestamp = this.states.get(state);
    if (!timestamp) return false;

    this.states.delete(state); // single-use

    if (Date.now() - timestamp > STATE_TTL_MS) return false;

    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [state, timestamp] of this.states) {
      if (now - timestamp > STATE_TTL_MS) {
        this.states.delete(state);
      }
    }
  }
}
