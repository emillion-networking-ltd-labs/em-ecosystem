import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PasswordBreachService {
  private readonly logger = new Logger(PasswordBreachService.name);

  /**
   * Check if a password has appeared in known data breaches using
   * the HaveIBeenPwned Pwned Passwords API (k-anonymity approach).
   *
   * Only the first 5 characters of the SHA-1 hash are sent to the API.
   * Fail-open: returns false on any error (timeout, network, parse).
   */
  async isBreached(password: string): Promise<boolean> {
    try {
      const sha1 = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();

      const prefix = sha1.substring(0, 5);
      const suffix = sha1.substring(5);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(
          `https://api.pwnedpasswords.com/range/${prefix}`,
          {
            headers: { 'User-Agent': 'NexaCoreAPI-PasswordCheck' },
            signal: controller.signal,
          },
        );

        clearTimeout(timeout);

        if (!response.ok) {
          this.logger.warn(
            `HIBP API returned status ${response.status} for prefix ${prefix}`,
          );
          return false;
        }

        const text = await response.text();
        const lines = text.split('\n');

        for (const line of lines) {
          const [hashSuffix] = line.trim().split(':');
          if (hashSuffix === suffix) {
            return true;
          }
        }

        return false;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      this.logger.warn(
        `HIBP API check failed (fail-open): ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return false;
    }
  }
}
