/**
 * Online ML Scorer Interceptor — SCRUM-460 / Phase 8 / Cap 5.
 *
 * Wires OnlineMlScorerService to the per-request pipeline. Measures
 * request duration + captures status code, then calls scorer.score()
 * AFTER the handler resolves (or errors). The return value is discarded
 * — Phase 8 is observation-only.
 *
 * ── §15 AUTH-SAFETY ───────────────────────────────────────────────────────
 *
 * AUTH paths are skipped early here AND inside the service (defense-in-depth,
 * per OQ-2 of Phase 8 Cap 5 install design). The interceptor never calls
 * the scorer for AUTH-listed paths.
 *
 * ── FAIL-OPEN ─────────────────────────────────────────────────────────────
 *
 * safeScore() wraps the call with try/catch — any failure in the scorer
 * is logged via Nest Logger but NEVER propagates to the request pipeline.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { OnlineMlScorerService } from '../services/online-ml-scorer.service';

const AUTH_SKIP = ['/auth/', '/oauth/', '/sessions/', '/mfa/', '/passkey/'];

@Injectable()
export class OnlineMlScorerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('OnlineMlScorerInterceptor');

  constructor(private readonly scorer: OnlineMlScorerService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const res = ctx.switchToHttp().getResponse<Response>();
    if (AUTH_SKIP.some((p) => req.path.startsWith(p))) {
      return next.handle();
    }
    const started = Date.now();
    return next.handle().pipe(
      tap({
        next: () => this.safeScore(req, started, res.statusCode),
        error: () => this.safeScore(req, started, res.statusCode || 500),
      }),
    );
  }

  private safeScore(req: Request, started: number, statusCode: number): void {
    try {
      this.scorer.score(req, Date.now() - started, statusCode);
    } catch (e) {
      this.logger.error(`scorer call failed: ${(e as Error).message}`);
    }
  }
}
