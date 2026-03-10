import { Injectable, Logger } from '@nestjs/common';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly VERIFY_URL =
    'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  // Dev key always passes — override with real key in production
  private readonly secretKey: string =
    process.env.TURNSTILE_SECRET_KEY ?? '1x0000000000000000000000000000000AA';

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    try {
      const body: Record<string, string> = {
        secret: this.secretKey,
        response: token,
      };
      if (remoteIp) body.remoteip = remoteIp;

      const res = await fetch(this.VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });

      const data = (await res.json()) as TurnstileResponse;

      if (!data.success) {
        this.logger.warn(
          `Turnstile verification failed: ${data['error-codes']?.join(', ') ?? 'unknown'}`,
        );
      }

      return data.success;
    } catch (error) {
      this.logger.error('Turnstile siteverify request failed', error);
      // Fail closed — reject if Cloudflare is unreachable
      return false;
    }
  }
}
